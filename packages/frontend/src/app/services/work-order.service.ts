import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Task {
  id?: string;
  description: string;
  priority: 'preventiva' | 'correttiva' | 'urgente';
  assignedTechnician: string;
  status: 'aperta' | 'in_progress' | 'risolte' | 'parziali';
}

export interface WorkOrder {
  id?: string;
  trainNumber: string;
  shift: string;
  codiceODL: string;
  status: 'pending' | 'active' | 'completed';
  tasks: Task[];
  createdAt?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class WorkOrderService {
  private workOrders$ = new BehaviorSubject<WorkOrder[]>([]);
  private selectedWorkOrder$ = new BehaviorSubject<WorkOrder | null>(null);

  constructor() {
    this.loadWorkOrders();
  }

  getWorkOrders(): Observable<WorkOrder[]> {
    return this.workOrders$.asObservable();
  }

  getSelectedWorkOrder(): Observable<WorkOrder | null> {
    return this.selectedWorkOrder$.asObservable();
  }

  selectWorkOrder(workOrder: WorkOrder): void {
    this.selectedWorkOrder$.next(workOrder);
  }

  createWorkOrder(trainNumber: string, shift: string): void {
    const newWorkOrder: WorkOrder = {
      id: Date.now().toString(),
      trainNumber,
      shift,
      codiceODL: this.generateODL(),
      status: 'active',
      tasks: [],
      createdAt: new Date(),
    };

    const current = this.workOrders$.value;
    this.workOrders$.next([...current, newWorkOrder]);
    this.selectWorkOrder(newWorkOrder);
  }

  addTask(workOrderId: string | undefined, task: Task): void {
    if (!workOrderId) return;

    const current = this.workOrders$.value;
    const updated = current.map((wo) => {
      if (wo.id === workOrderId) {
        const newTask: Task = {
          id: Date.now().toString(),
          ...task,
          status: 'aperta',
        };
        return { ...wo, tasks: [...wo.tasks, newTask] };
      }
      return wo;
    });

    this.workOrders$.next(updated);

    const selected = this.selectedWorkOrder$.value;
    if (selected && selected.id === workOrderId) {
      this.selectWorkOrder(updated.find((wo) => wo.id === workOrderId)!);
    }
  }

  private generateODL(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'ODL-';
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private loadWorkOrders(): void {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('workOrders');
    if (saved) {
      try {
        this.workOrders$.next(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading work orders', e);
      }
    }
  }

  saveWorkOrders(): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem('workOrders', JSON.stringify(this.workOrders$.value));
  }
}
