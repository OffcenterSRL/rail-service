import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { WorkOrder, WorkOrderService } from '../../services/work-order.service';

@Component({
  selector: 'app-work-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="work-order-list-container">
      <!-- Create new work order form -->
      <div class="new-order-section">
        <input
          type="text"
          placeholder="N° Treno (es. ETR700-12)"
          [(ngModel)]="trainNumber"
          class="input-field"
        />
        <input
          type="text"
          placeholder="Turno (es. Mattina 06-14)"
          [(ngModel)]="shift"
          class="input-field"
        />
        <button (click)="createOrder()" class="btn-create">+</button>
      </div>

      <!-- List of work orders -->
      <div class="orders-list">
        <div
          *ngFor="let order of workOrders$ | async"
          [class.active]="isOrderActive(order)"
          (click)="selectOrder(order)"
          class="order-card"
        >
          <div class="order-title">{{ order.trainNumber }}</div>
          <div class="order-info">
            {{ order.codiceODL }} · {{ order.shift }}
          </div>
          <div class="order-count">{{ order.tasks.length }}/1</div>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="(workOrders$ | async)?.length === 0" class="empty-state">
        <p>Nessun ordine</p>
      </div>
    </div>
  `,
  styles: [
    `
      .work-order-list-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        height: 100%;
      }

      .new-order-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--dark-tertiary);
      }

      .input-field {
        width: 100%;
        padding: 8px 12px;
        background-color: var(--dark-secondary);
        border: 1px solid var(--dark-tertiary);
        border-radius: 4px;
        color: var(--text-primary);
        font-size: 13px;

        &::placeholder {
          color: var(--text-secondary);
        }

        &:focus {
          outline: none;
          border-color: var(--accent-orange);
        }
      }

      .btn-create {
        align-self: flex-end;
        background-color: var(--accent-orange);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;

        &:hover {
          background-color: var(--accent-orange-dark);
        }
      }

      .orders-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        overflow-y: auto;
        flex: 1;
      }

      .order-card {
        background-color: var(--dark-secondary);
        border: 2px solid transparent;
        border-radius: 6px;
        padding: 12px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background-color: #3a3a3a;
        }

        &.active {
          border-color: var(--accent-orange);
          background-color: #2a2a2a;
        }
      }

      .order-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      .order-info {
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 4px;
      }

      .order-count {
        font-size: 13px;
        color: var(--text-secondary);
        text-align: right;
      }

      .empty-state {
        text-align: center;
        padding: 20px;
        color: var(--text-secondary);
        font-size: 14px;
      }
    `,
  ],
})
export class WorkOrderListComponent implements OnInit {
  workOrders$: Observable<WorkOrder[]>;
  trainNumber = '';
  shift = '';
  private selectedWorkOrder: WorkOrder | null = null;
  private workOrderService = inject(WorkOrderService);

  constructor() {
    this.workOrders$ = this.workOrderService.getWorkOrders();
  }

  ngOnInit(): void {
    this.workOrderService.getSelectedWorkOrder().subscribe((order) => {
      this.selectedWorkOrder = order;
    });
  }

  createOrder(): void {
    if (this.trainNumber.trim() && this.shift.trim()) {
      this.workOrderService.createWorkOrder(this.trainNumber, this.shift);
      this.trainNumber = '';
      this.shift = '';
      this.workOrderService.saveWorkOrders();
    }
  }

  selectOrder(order: WorkOrder): void {
    this.workOrderService.selectWorkOrder(order);
  }

  isOrderActive(order: WorkOrder): boolean {
    return this.selectedWorkOrder?.id === order.id;
  }
}
