import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TicketRecord, TicketService, TicketPayload } from './ticket.service';

export interface Task {
  id: string;
  description: string;
  priority: 'preventiva' | 'correttiva' | 'urgente';
  assignedTechnicianId?: string;
  assignedTechnicianName: string;
  assignedTechnicianNickname: string;
  status: 'aperta' | 'in_progress' | 'risolte' | 'parziali';
  timeSpentMinutes?: number;
  performedBy?: Array<{ id: string; name: string; matricola: string }>;
}

export interface WorkOrder {
  id: string;
  trainNumber: string;
  shift: string;
  codiceODL: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  tasks: Task[];
  createdAt?: Date;
  assignedTechnician?: string;
}

@Injectable({
  providedIn: 'root',
})
export class WorkOrderService {
  private workOrders$ = new BehaviorSubject<WorkOrder[]>([]);
  private selectedWorkOrder$ = new BehaviorSubject<WorkOrder | null>(null);
  private tasksCache: Record<string, Task[]> = {};
  private orderMeta: Record<string, { assignedTechnician?: string; odlNumber?: string }> = {};
  private readonly tasksStorageKey = 'rail-work-order-tasks';
  private readonly metaStorageKey = 'rail-work-order-meta';

  constructor(private ticketService: TicketService) {
    this.loadTasksCache();
    this.loadOrderMetaCache();
    this.refreshWorkOrders();
  }

  getWorkOrders(): Observable<WorkOrder[]> {
    return this.workOrders$.asObservable();
  }

  getSelectedWorkOrder(): Observable<WorkOrder | null> {
    return this.selectedWorkOrder$.asObservable();
  }

  selectWorkOrder(workOrder: WorkOrder | null): void {
    this.selectedWorkOrder$.next(workOrder);
  }

  createWorkOrder(
    trainNumber: string,
    shift: string,
    assignedTechnician?: string,
    odlNumber?: string,
  ): Observable<WorkOrder> {
    const payload = this.buildPayloadForShift(trainNumber, shift);
    return this.ticketService.bookTicket(payload).pipe(
      map((ticket) => {
        if (assignedTechnician || odlNumber) {
          this.orderMeta[ticket._id] = {
            assignedTechnician,
            odlNumber,
          };
          this.persistOrderMetaCache();
        }
        return this.mergeTicket(ticket);
      }),
    );
  }

  cancelWorkOrder(workOrderId: string): Observable<WorkOrder> {
    return this.ticketService.cancelTicket(workOrderId).pipe(
      map((ticket) => {
        const updated = this.mapTicketToWorkOrder(ticket, this.orderMeta[ticket._id]);
        const others = this.workOrders$.value.filter((order) => order.id !== updated.id);
        this.workOrders$.next([...others, updated]);
        if (this.selectedWorkOrder$.value?.id === updated.id) {
          this.selectWorkOrder(updated);
        } else {
          this.ensureSelection([...others, updated]);
        }
        return updated;
      }),
    );
  }

  addTask(workOrderId: string, task: Omit<Task, 'id' | 'status'>): void {
    if (!workOrderId) {
      return;
    }

    const existing = this.tasksCache[workOrderId] ?? [];
    const newTask: Task = {
      id: this.generateTaskId(),
      ...task,
      status: 'aperta',
    };
    this.tasksCache[workOrderId] = [...existing, newTask];
    this.persistTasksCache();
    this.refreshTasksForOrder(workOrderId);
  }

  updateTask(workOrderId: string, taskId: string, updates: Partial<Task>): void {
    if (!workOrderId || !taskId) {
      return;
    }
    const existing = this.tasksCache[workOrderId] ?? [];
    const next = existing.map((task) =>
      task.id === taskId ? { ...task, ...updates } : task,
    );
    this.tasksCache[workOrderId] = next;
    this.persistTasksCache();
    this.refreshTasksForOrder(workOrderId);
  }

  saveWorkOrders(): void {
    this.persistTasksCache();
  }

  private refreshWorkOrders(): void {
    this.ticketService.getTickets().subscribe({
      next: (tickets) => {
        const workOrders = tickets.map((ticket) =>
          this.mapTicketToWorkOrder(ticket, this.orderMeta[ticket._id]),
        );
        this.workOrders$.next(workOrders);
        this.ensureSelection(workOrders);
      },
      error: () => {
        this.workOrders$.next([]);
        this.selectWorkOrder(null);
      },
    });
  }

  private mergeTicket(ticket: TicketRecord): WorkOrder {
    const order = this.mapTicketToWorkOrder(ticket, this.orderMeta[ticket._id]);
    const others = this.workOrders$.value.filter((wo) => wo.id !== order.id);
    this.workOrders$.next([order, ...others]);
    this.selectWorkOrder(order);
    return order;
  }

  private mapTicketToWorkOrder(
    ticket: TicketRecord,
    meta?: { assignedTechnician?: string; odlNumber?: string },
  ): WorkOrder {
    const tasks = this.tasksCache[ticket._id] ?? [];
    const manualOdl = meta?.odlNumber?.trim();
    return {
      id: ticket._id,
      trainNumber: ticket.trainId,
      shift: this.shiftFromTimestamp(ticket.departureTime),
      codiceODL: manualOdl ? `ODL-${manualOdl}` : 'ODL-N/D',
      status: this.ticketStatusToWorkOrderStatus(ticket.status),
      tasks,
      createdAt: new Date(ticket.bookingDate),
      assignedTechnician: meta?.assignedTechnician,
    };
  }

  private ensureSelection(workOrders: WorkOrder[]): void {
    const selectedId = this.selectedWorkOrder$.value?.id;
    const fromList = selectedId ? workOrders.find((order) => order.id === selectedId) : null;
    const next = fromList ?? (workOrders.length ? workOrders[0] : null);
    this.selectWorkOrder(next);
  }

  private refreshTasksForOrder(workOrderId: string): void {
    const updated = this.workOrders$.value.map((order) =>
      order.id === workOrderId ? { ...order, tasks: this.tasksCache[workOrderId] } : order,
    );
    this.workOrders$.next(updated);
    if (this.selectedWorkOrder$.value?.id === workOrderId) {
      this.selectWorkOrder(updated.find((order) => order.id === workOrderId) ?? null);
    }
  }

  private buildPayloadForShift(trainNumber: string, shift: string): TicketPayload {
    const now = new Date();
    const baseHour = this.extractShiftStart(shift);
    const departure = new Date(now);
    departure.setHours(baseHour, 0, 0, 0);
    if (departure <= now) {
      departure.setDate(departure.getDate() + 1);
    }

    const arrival = new Date(departure);
    arrival.setHours(arrival.getHours() + 3);

    return {
      userId: `capoturno-${Date.now()}`,
      trainId: trainNumber,
      departureStation: 'Roma Tiburtina',
      arrivalStation: 'Milano Centrale',
      departureTime: departure.toISOString(),
      arrivalTime: arrival.toISOString(),
      price: 100 + Math.floor(Math.random() * 120),
      seatNumber: `0${Math.floor(Math.random() * 30) + 1}A`,
    };
  }

  private shiftFromTimestamp(timestamp?: string): string {
    if (!timestamp) {
      return 'Turno in corso';
    }
    const hour = new Date(timestamp).getHours();
    if (hour >= 6 && hour < 14) {
      return 'Mattina (06-14)';
    }
    if (hour >= 14 && hour < 22) {
      return 'Pomeriggio (14-22)';
    }
    return 'Notte (22-06)';
  }

  private extractShiftStart(shift: string): number {
    if (shift.includes('06')) {
      return 6;
    }
    if (shift.includes('14')) {
      return 14;
    }
    return 22;
  }

  private ticketStatusToWorkOrderStatus(status: TicketRecord['status']): WorkOrder['status'] {
    if (status === 'active') {
      return 'active';
    }
    if (status === 'cancelled') {
      return 'cancelled';
    }
    if (status === 'used') {
      return 'completed';
    }
    return 'pending';
  }

  private generateTaskId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return (crypto as Crypto).randomUUID();
    }
    return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private loadTasksCache(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const serialized = window.localStorage.getItem(this.tasksStorageKey);
    if (!serialized) {
      return;
    }
    try {
      this.tasksCache = this.normalizeTasksCache(JSON.parse(serialized));
    } catch {
      this.tasksCache = {};
    }
  }

  private persistTasksCache(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(this.tasksStorageKey, JSON.stringify(this.tasksCache));
  }

  private loadOrderMetaCache(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const serialized = window.localStorage.getItem(this.metaStorageKey);
    if (!serialized) {
      return;
    }
    try {
      this.orderMeta = JSON.parse(serialized);
    } catch {
      this.orderMeta = {};
    }
  }

  private persistOrderMetaCache(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(this.metaStorageKey, JSON.stringify(this.orderMeta));
  }

  private normalizeTasksCache(cache: Record<string, Task[]>): Record<string, Task[]> {
    const normalized: Record<string, Task[]> = {};
    Object.entries(cache).forEach(([key, tasks]) => {
      normalized[key] = (tasks ?? []).map((task) => {
        const legacy = task as Task & { assignedTechnician?: string };
        return {
          ...task,
          assignedTechnicianId: legacy.assignedTechnicianId ?? legacy.assignedTechnician,
          assignedTechnicianName: legacy.assignedTechnicianName ?? legacy.assignedTechnician ?? '',
          assignedTechnicianNickname:
            (legacy as Task & { assignedTechnicianNickname?: string }).assignedTechnicianNickname ??
            legacy.assignedTechnician ??
            legacy.assignedTechnicianName ??
            '',
        };
      });
    });
    return normalized;
  }
}
