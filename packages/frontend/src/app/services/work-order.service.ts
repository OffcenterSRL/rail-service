import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { TicketRecord, TicketService, TaskPayload } from './ticket.service';

export interface Task {
  id: string;
  description: string;
  priority: 'preventiva' | 'correttiva' | 'urgente';
  preventiveType?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName: string;
  assignedTechnicianNickname: string;
  status: 'aperta' | 'in_progress' | 'risolte' | 'rimandato';
  timeSpentMinutes?: number;
  performedBy?: Array<{ id: string; name: string; matricola: string }>;
  deferredKey?: string;
  deferredSince?: string;
  deferredCount?: number;
}

export interface WorkOrder {
  id: string;
  trainNumber: string;
  shift: string;
  codiceODL: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  tasks: Task[];
  createdAt?: Date;
  openedAt?: Date;
  assignedTechnician?: string;
}

interface DeferredTaskRecord {
  deferredKey: string;
  description: string;
  priority: Task['priority'];
  assignedTechnicianId?: string;
  assignedTechnicianName: string;
  assignedTechnicianNickname: string;
  deferredSince: string;
  deferredCount: number;
  lastDeferredOrderId: string;
  active: boolean;
}

const POLL_INTERVAL_MS = 5000;

@Injectable({
  providedIn: 'root',
})
export class WorkOrderService implements OnDestroy {
  private workOrders$ = new BehaviorSubject<WorkOrder[]>([]);
  private selectedWorkOrder$ = new BehaviorSubject<WorkOrder | null>(null);
  private deferredByTrain: Record<string, DeferredTaskRecord[]> = {};
  private pollingSubscription: Subscription | null = null;

  constructor(private ticketService: TicketService) {
    this.refreshWorkOrders();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  getWorkOrders(): Observable<WorkOrder[]> {
    return this.workOrders$.asObservable();
  }

  getSelectedWorkOrder(): Observable<WorkOrder | null> {
    return this.selectedWorkOrder$.asObservable();
  }

  selectWorkOrder(workOrder: WorkOrder | null): void {
    this.stopPolling();
    this.selectedWorkOrder$.next(workOrder);
    if (workOrder) {
      this.startPolling(workOrder.id);
    }
  }

  createWorkOrder(
    trainNumber: string,
    shift: string,
    assignedTechnician?: string,
    odlNumber?: string,
    openedAt?: Date,
  ): Observable<WorkOrder> {
    return this.ticketService
      .bookTicket({ trainNumber, shift, codiceODL: odlNumber, openedAt: openedAt?.toISOString(), assignedTechnician })
      .pipe(
        map((ticket) => {
          const order = this.mapTicketToWorkOrder(ticket);
          const others = this.workOrders$.value.filter((o) => o.id !== order.id);
          this.workOrders$.next([order, ...others]);
          this.selectWorkOrder(order);
          return order;
        }),
      );
  }

  getPendingDeferredTasks(trainNumber: string, workOrderId: string): Task[] {
    const order = this.workOrders$.value.find((o) => o.id === workOrderId);
    return this.buildDeferredTasksForOrder(trainNumber, workOrderId, order?.tasks ?? []);
  }

  acceptDeferredTask(workOrderId: string, task: Task): void {
    this.addTask(workOrderId, {
      description: task.description,
      priority: task.priority,
      assignedTechnicianId: task.assignedTechnicianId,
      assignedTechnicianName: task.assignedTechnicianName,
      assignedTechnicianNickname: task.assignedTechnicianNickname,
      deferredKey: task.deferredKey,
      deferredSince: task.deferredSince,
      deferredCount: task.deferredCount,
    });
  }

  cancelWorkOrder(workOrderId: string): Observable<WorkOrder> {
    return this.ticketService.cancelTicket(workOrderId).pipe(
      map((ticket) => {
        const updated = this.mapTicketToWorkOrder(ticket);
        const nextList = this.upsertInPlace(this.workOrders$.value, updated);
        this.workOrders$.next(nextList);
        if (this.selectedWorkOrder$.value?.id === updated.id) {
          this.selectedWorkOrder$.next(updated);
        } else {
          this.ensureSelection(nextList);
        }
        return updated;
      }),
    );
  }

  completeWorkOrder(workOrderId: string): Observable<WorkOrder> {
    const closingOrder = this.workOrders$.value.find((o) => o.id === workOrderId);
    if (closingOrder) {
      this.incrementPendingDeferredsOnClose(closingOrder.trainNumber, workOrderId);
    }
    return this.ticketService.completeTicket(workOrderId).pipe(
      map((ticket) => {
        const updated = this.mapTicketToWorkOrder(ticket);
        const nextList = this.upsertInPlace(this.workOrders$.value, updated);
        this.workOrders$.next(nextList);
        if (this.selectedWorkOrder$.value?.id === updated.id) {
          const nextActive =
            nextList.find(
              (o) => o.id !== updated.id && o.status !== 'completed' && o.status !== 'cancelled',
            ) ?? null;
          this.selectWorkOrder(nextActive);
        } else {
          this.ensureSelection(nextList);
        }
        return updated;
      }),
    );
  }

  addTask(workOrderId: string, task: Omit<Task, 'id' | 'status'>): void {
    if (!workOrderId) return;
    const payload: TaskPayload = {
      description: task.description,
      priority: task.priority,
      preventiveType: task.preventiveType,
      assignedTechnicianId: task.assignedTechnicianId,
      assignedTechnicianName: task.assignedTechnicianName,
      assignedTechnicianNickname: task.assignedTechnicianNickname,
      deferredKey: task.deferredKey,
      deferredSince: task.deferredSince,
      deferredCount: task.deferredCount,
    };
    this.ticketService.addTask(workOrderId, payload).subscribe((ticket) => {
      this.mergeTicket(ticket);
    });
  }

  updateTask(workOrderId: string, taskId: string, updates: Partial<Task>): void {
    if (!workOrderId || !taskId) return;
    const order = this.workOrders$.value.find((o) => o.id === workOrderId);
    const task = order?.tasks.find((t) => t.id === taskId);
    if (!task) return;

    let applied = { ...task, ...updates };
    if (order) {
      applied = this.applyDeferredRules(order.trainNumber, workOrderId, task, applied, order.createdAt);
    }

    const { id: _id, ...apiUpdates } = applied;
    this.ticketService.updateTask(workOrderId, taskId, apiUpdates).subscribe((ticket) => {
      this.mergeTicket(ticket);
      this.rebuildDeferredCache(this.workOrders$.value);
    });
  }

  deleteTask(workOrderId: string, taskId: string): void {
    if (!workOrderId || !taskId) return;
    this.ticketService.deleteTask(workOrderId, taskId).subscribe((ticket) => {
      this.mergeTicket(ticket);
    });
  }

  saveWorkOrders(): void {
    // no-op: data is now persisted server-side
  }

  private refreshWorkOrders(): void {
    this.ticketService.getTickets().subscribe({
      next: (tickets) => {
        const workOrders = tickets.map((ticket) => this.mapTicketToWorkOrder(ticket));
        this.workOrders$.next(workOrders);
        this.rebuildDeferredCache(workOrders);
        this.ensureSelection(workOrders);
      },
      error: () => {
        this.workOrders$.next([]);
        this.selectWorkOrder(null);
      },
    });
  }

  private startPolling(workOrderId: string): void {
    this.pollingSubscription = timer(0, POLL_INTERVAL_MS)
      .pipe(switchMap(() => this.ticketService.getTicket(workOrderId)))
      .subscribe({
        next: (ticket) => {
          if (this.selectedWorkOrder$.value?.id !== workOrderId) {
            return;
          }
          const updated = this.mapTicketToWorkOrder(ticket);
          const nextList = this.upsertInPlace(this.workOrders$.value, updated);
          this.workOrders$.next(nextList);
          this.rebuildDeferredCache(nextList);
          this.selectedWorkOrder$.next(updated);
        },
        error: () => {
          // ignore transient polling errors
        },
      });
  }

  private stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  private upsertInPlace(list: WorkOrder[], updated: WorkOrder): WorkOrder[] {
    const idx = list.findIndex((o) => o.id === updated.id);
    if (idx < 0) {
      return [...list, updated];
    }
    const next = list.slice();
    next[idx] = updated;
    return next;
  }

  private mergeTicket(ticket: TicketRecord): void {
    const order = this.mapTicketToWorkOrder(ticket);
    const nextList = this.upsertInPlace(this.workOrders$.value, order);
    this.workOrders$.next(nextList);
    if (this.selectedWorkOrder$.value?.id === order.id) {
      this.selectedWorkOrder$.next(order);
    }
  }

  private mapTicketToWorkOrder(ticket: TicketRecord): WorkOrder {
    return {
      id: ticket._id,
      trainNumber: ticket.trainNumber ?? 'N/D',
      shift: ticket.shift ?? 'Turno in corso',
      codiceODL: ticket.codiceODL ?? 'ODL-N/D',
      status: ticket.status ?? 'active',
      tasks: (ticket.tasks ?? []).map((t) => ({ ...t, id: t._id })),
      createdAt: new Date(ticket.createdAt),
      openedAt: ticket.openedAt ? new Date(ticket.openedAt) : undefined,
      assignedTechnician: ticket.assignedTechnician,
    };
  }

  private ensureSelection(workOrders: WorkOrder[]): void {
    const selectedId = this.selectedWorkOrder$.value?.id;
    const fromList = selectedId ? workOrders.find((order) => order.id === selectedId) : null;
    const next = fromList ?? (workOrders.length ? workOrders[0] : null);
    this.selectWorkOrder(next);
  }

  private rebuildDeferredCache(workOrders: WorkOrder[]): void {
    this.deferredByTrain = {};
    workOrders.forEach((order) => {
      order.tasks
        .filter((t) => t.status === 'rimandato' && t.deferredKey)
        .forEach((t) => {
          if (!this.deferredByTrain[order.trainNumber]) {
            this.deferredByTrain[order.trainNumber] = [];
          }
          const list = this.deferredByTrain[order.trainNumber];
          const record: DeferredTaskRecord = {
            deferredKey: t.deferredKey!,
            description: t.description,
            priority: t.priority,
            assignedTechnicianId: t.assignedTechnicianId,
            assignedTechnicianName: t.assignedTechnicianName,
            assignedTechnicianNickname: t.assignedTechnicianNickname,
            deferredSince: t.deferredSince ?? new Date().toISOString(),
            deferredCount: t.deferredCount ?? 1,
            lastDeferredOrderId: order.id,
            active: true,
          };
          const idx = list.findIndex((r) => r.deferredKey === record.deferredKey);
          if (idx >= 0) {
            // Keep the record with the highest count (most recent deferral wins)
            if (record.deferredCount >= list[idx].deferredCount) {
              list[idx] = record;
            }
          } else {
            list.push(record);
          }
        });
    });

    // Second pass: remove any deferredKey that has been resolved in any order
    const resolvedKeys = new Set<string>();
    workOrders.forEach((order) => {
      order.tasks
        .filter((t) => t.status === 'risolte' && t.deferredKey)
        .forEach((t) => resolvedKeys.add(`${order.trainNumber}::${t.deferredKey}`));
    });
    for (const trainNumber of Object.keys(this.deferredByTrain)) {
      this.deferredByTrain[trainNumber] = this.deferredByTrain[trainNumber].filter(
        (r) => !resolvedKeys.has(`${trainNumber}::${r.deferredKey}`),
      );
    }
  }

  private buildDeferredTasksForOrder(
    trainNumber: string,
    workOrderId: string,
    existingTasks: Task[],
  ): Task[] {
    const deferredList = (this.deferredByTrain[trainNumber] ?? []).filter(
      (item) => item.active !== false && item.lastDeferredOrderId !== workOrderId,
    );
    if (!deferredList.length) return [];

    const existingKeys = new Set(
      existingTasks.map((t) => t.deferredKey).filter((k): k is string => !!k),
    );
    return deferredList
      .filter((item) => !existingKeys.has(item.deferredKey))
      .map((item) => ({
        id: this.generateTaskId(),
        description: item.description,
        priority: item.priority,
        assignedTechnicianId: item.assignedTechnicianId,
        assignedTechnicianName: item.assignedTechnicianName,
        assignedTechnicianNickname: item.assignedTechnicianNickname,
        status: 'rimandato' as const,
        deferredKey: item.deferredKey,
        deferredSince: item.deferredSince,
        deferredCount: item.deferredCount,
      }));
  }

  private applyDeferredRules(
    trainNumber: string,
    workOrderId: string,
    previous: Task,
    next: Task,
    orderCreatedAt?: Date,
  ): Task {
    if (next.status === 'rimandato') {
      const nowIso = new Date().toISOString();
      const existing = this.findDeferredRecord(trainNumber, next.deferredKey);
      const createdAtIso = orderCreatedAt ? new Date(orderCreatedAt).toISOString() : nowIso;
      const deferredSince = next.deferredSince ?? existing?.deferredSince ?? createdAtIso;
      // Use the cache as authoritative count to avoid stale values from the task record
      let deferredCount = existing?.deferredCount ?? next.deferredCount ?? 0;
      // Increment only once per ODL: if lastDeferredOrderId is already this ODL, skip
      const alreadyCountedInThisOdl = existing?.lastDeferredOrderId === workOrderId;
      if (!alreadyCountedInThisOdl) {
        deferredCount = Math.max(1, deferredCount + 1);
      }
      const deferredKey = next.deferredKey ?? existing?.deferredKey ?? this.generateTaskId();
      const record: DeferredTaskRecord = {
        deferredKey,
        description: next.description,
        priority: next.priority,
        assignedTechnicianId: next.assignedTechnicianId,
        assignedTechnicianName: next.assignedTechnicianName,
        assignedTechnicianNickname: next.assignedTechnicianNickname,
        deferredSince,
        deferredCount,
        lastDeferredOrderId: workOrderId,
        active: true,
      };
      this.upsertDeferredRecord(trainNumber, record);
      return { ...next, deferredKey, deferredSince, deferredCount };
    }

    if (previous.status === 'rimandato' && previous.deferredKey) {
      const newCount = Math.max(0, (previous.deferredCount ?? 1) - 1);
      if (next.status === 'risolte') {
        this.removeDeferredRecord(trainNumber, previous.deferredKey);
      } else {
        const existing = this.findDeferredRecord(trainNumber, previous.deferredKey);
        if (existing) {
          this.upsertDeferredRecord(trainNumber, {
            ...existing,
            deferredCount: newCount,
            active: false,
            lastDeferredOrderId: '',
          });
        }
      }
      return { ...next, deferredCount: newCount };
    }

    // Task was not rimandato but has a deferredKey and is being resolved:
    // remove it from the deferred chain so it won't resurface in future ODLs
    if (next.status === 'risolte' && previous.deferredKey) {
      this.removeDeferredRecord(trainNumber, previous.deferredKey);
    }

    return next;
  }

  private findDeferredRecord(
    trainNumber: string,
    deferredKey?: string,
  ): DeferredTaskRecord | undefined {
    if (!deferredKey) return undefined;
    return (this.deferredByTrain[trainNumber] ?? []).find((r) => r.deferredKey === deferredKey);
  }

  private upsertDeferredRecord(trainNumber: string, record: DeferredTaskRecord): void {
    const list = this.deferredByTrain[trainNumber] ?? [];
    const idx = list.findIndex((r) => r.deferredKey === record.deferredKey);
    if (idx >= 0) list[idx] = record;
    else list.push(record);
    this.deferredByTrain[trainNumber] = list;
  }

  private removeDeferredRecord(trainNumber: string, deferredKey: string): void {
    const list = this.deferredByTrain[trainNumber] ?? [];
    this.deferredByTrain[trainNumber] = list.filter((r) => r.deferredKey !== deferredKey);
  }

  private incrementPendingDeferredsOnClose(trainNumber: string, closingOrderId: string): void {
    const pendingRecords = (this.deferredByTrain[trainNumber] ?? []).filter(
      (r) => r.active !== false && r.lastDeferredOrderId !== closingOrderId,
    );

    for (const record of pendingRecords) {
      const newCount = record.deferredCount + 1;
      this.upsertDeferredRecord(trainNumber, { ...record, deferredCount: newCount });

      const sourceOrder = this.workOrders$.value.find((o) => o.id === record.lastDeferredOrderId);
      const sourceTask = sourceOrder?.tasks.find(
        (t) => t.deferredKey === record.deferredKey && t.status === 'rimandato',
      );
      if (sourceOrder && sourceTask) {
        const updated = { ...sourceTask, deferredCount: newCount };
        const { id: _id, ...apiUpdates } = updated;
        this.ticketService.updateTask(sourceOrder.id, sourceTask.id, apiUpdates).subscribe((ticket) => {
          this.mergeTicket(ticket);
        });
      }
    }
  }

  private generateTaskId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return (crypto as Crypto).randomUUID();
    }
    return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
