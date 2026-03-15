import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Task,
  WorkOrder,
  WorkOrderService,
} from '../../services/work-order.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dashboard">
      <!-- Empty state when no order is selected -->
      <div *ngIf="!selectedOrder" class="empty-state">
        <div class="empty-icon">🚂</div>
        <p class="empty-title">Seleziona un treno dalla lista</p>
        <p class="empty-subtitle">o crea un nuovo ordine di lavoro</p>
      </div>

      <!-- Work order details -->
      <ng-container *ngIf="selectedOrder">
        <!-- Work Order Header -->
        <div class="work-order-header">
          <div>
            <h1 class="train-number">Treno {{ selectedOrder.trainNumber }}</h1>
            <p class="work-order-info">
              {{ selectedOrder.codiceODL }} · Turno: {{ selectedOrder.shift }}
            </p>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary">📋 Copia codice tecnico</button>
            <button class="btn btn-primary">📤 Esporta turno</button>
            <button class="btn btn-danger">🗑️</button>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-badge totale"></div>
            <div class="stat-content">
              <span class="stat-label">TOTALE</span>
              <span class="stat-value">{{ selectedOrder.tasks.length }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-badge risolte"></div>
            <div class="stat-content">
              <span class="stat-label">RISOLTE</span>
              <span class="stat-value">{{ getTasksByStatus('risolte') }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-badge parziali"></div>
            <div class="stat-content">
              <span class="stat-label">PARZIALI</span>
              <span class="stat-value">{{ getTasksByStatus('parziali') }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-badge attesa"></div>
            <div class="stat-content">
              <span class="stat-label">IN ATTESA</span>
              <span class="stat-value">{{ getTasksByStatus('aperta') }}</span>
            </div>
          </div>
        </div>

        <!-- Work Order Code -->
        <div class="work-order-code">
          <span class="code-icon">🔧</span>
          <span class="code-text"
            ><strong>Codice per il tecnico:</strong>
            {{ selectedOrder.codiceODL }} - il tecnico lo inserisce nella vista
            Tecnico</span
          >
        </div>

        <!-- New Task Form -->
        <div class="section">
          <div class="section-header">
            <span class="section-title">+ NUOVA LAVORAZIONE</span>
          </div>
          <form
            [formGroup]="newTaskForm"
            (ngSubmit)="onAddTask()"
            class="task-form"
          >
            <div class="form-row">
              <div class="form-group full-width">
                <input
                  type="text"
                  placeholder="Descrizione attività"
                  formControlName="description"
                  class="task-input"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <select formControlName="priority" class="task-input">
                  <option value="preventiva">Preventiva</option>
                  <option value="correttiva">Correttiva</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div class="form-group">
                <input
                  type="text"
                  placeholder="Tecnico assegnato"
                  formControlName="assignedTechnician"
                  class="task-input"
                />
              </div>
              <div class="form-group">
                <button type="submit" class="btn btn-add">Aggiungi</button>
              </div>
            </div>
          </form>
        </div>

        <!-- Tasks List -->
        <div class="section">
          <div class="section-header">
            <span class="section-title"
              >LAVORAZIONI ({{ selectedOrder.tasks.length }})</span
            >
          </div>
          <div *ngIf="selectedOrder.tasks.length === 0" class="tasks-empty">
            <p>Nessuna lavorazione aggiunta ancora.</p>
          </div>
          <div *ngFor="let task of selectedOrder.tasks" class="task-item">
            <div class="task-content">
              <div class="task-title">{{ task.description }}</div>
              <div class="task-meta">
                {{ task.priority | titlecase }} · Assegnata a:
                {{ task.assignedTechnician }}
              </div>
            </div>
            <div class="task-status">{{ task.status }}</div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [
    `
      .dashboard {
        display: flex;
        flex-direction: column;
        gap: 24px;
        height: 100%;
        overflow-y: auto;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: 16px;
        text-align: center;
      }

      .empty-icon {
        font-size: 64px;
        opacity: 0.5;
      }

      .empty-title {
        font-size: 20px;
        color: var(--text-primary);
        margin: 0;
        font-weight: 500;
      }

      .empty-subtitle {
        font-size: 14px;
        color: var(--text-secondary);
        margin: 0;
      }

      .work-order-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 24px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--dark-tertiary);
      }

      .train-number {
        font-size: 28px;
        font-weight: 600;
        margin: 0 0 4px 0;
      }

      .work-order-info {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }

      .btn {
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .btn-primary {
        background-color: #4a90e2;
        color: white;

        &:hover {
          background-color: #3a7bc8;
        }
      }

      .btn-secondary {
        background-color: var(--dark-tertiary);
        color: var(--text-secondary);

        &:hover {
          background-color: #4a4a4a;
        }
      }

      .btn-danger {
        background-color: var(--error);
        color: white;

        &:hover {
          background-color: #dc2626;
        }
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .stat-card {
        background-color: var(--dark-secondary);
        border: 1px solid var(--dark-tertiary);
        border-radius: 6px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .stat-badge {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex-shrink: 0;

        &.totale {
          background-color: #60a5fa;
        }

        &.risolte {
          background-color: var(--success);
        }

        &.parziali {
          background-color: var(--accent-orange);
        }

        &.attesa {
          background-color: var(--error);
        }
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stat-label {
        font-size: 11px;
        text-transform: uppercase;
        color: var(--text-secondary);
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      .stat-value {
        font-size: 18px;
        font-weight: 600;
      }

      .work-order-code {
        background-color: var(--dark-secondary);
        border: 1px solid var(--dark-tertiary);
        border-radius: 6px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 13px;
        color: var(--text-secondary);
      }

      .code-icon {
        font-size: 18px;
      }

      .code-text {
        flex: 1;

        strong {
          color: var(--accent-orange);
        }
      }

      .section {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .section-header {
        padding: 12px 0;
        border-bottom: 1px solid var(--dark-tertiary);
      }

      .section-title {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-secondary);
      }

      .task-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px 0;
      }

      .form-row {
        display: flex;
        gap: 12px;
        align-items: flex-end;
      }

      .form-group {
        flex: 1;
        min-width: 0;

        &.full-width {
          flex: 1 1 100%;
        }
      }

      .task-input {
        width: 100%;
        padding: 8px 12px;
        background-color: var(--dark-secondary);
        border: 1px solid var(--dark-tertiary);
        border-radius: 4px;
        color: var(--text-primary);
        font-size: 13px;

        &:focus {
          outline: none;
          border-color: var(--accent-orange);
        }

        &::placeholder {
          color: var(--text-secondary);
        }
      }

      .btn-add {
        background-color: var(--accent-orange);
        color: white;
        padding: 8px 16px;

        &:hover {
          background-color: var(--accent-orange-dark);
        }
      }

      .tasks-empty {
        padding: 24px;
        text-align: center;
        color: var(--text-secondary);
        font-size: 14px;
      }

      .task-item {
        background-color: var(--dark-secondary);
        border: 1px solid var(--dark-tertiary);
        border-radius: 6px;
        padding: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .task-content {
        flex: 1;
      }

      .task-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      .task-meta {
        font-size: 12px;
        color: var(--text-secondary);
      }

      .task-status {
        font-size: 12px;
        color: var(--text-secondary);
        padding: 4px 8px;
        background-color: var(--dark-tertiary);
        border-radius: 4px;
        white-space: nowrap;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  newTaskForm: FormGroup;
  selectedOrder: WorkOrder | null = null;

  constructor(
    private fb: FormBuilder,
    private workOrderService: WorkOrderService,
  ) {
    this.newTaskForm = this.fb.group({
      description: ['', Validators.required],
      priority: ['preventiva', Validators.required],
      assignedTechnician: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.workOrderService.getSelectedWorkOrder().subscribe((order) => {
      this.selectedOrder = order;
      this.newTaskForm.reset({
        description: '',
        priority: 'preventiva',
        assignedTechnician: '',
      });
    });
  }

  onAddTask(): void {
    if (this.newTaskForm.valid && this.selectedOrder?.id) {
      const task: Task = this.newTaskForm.value;
      this.workOrderService.addTask(this.selectedOrder.id, task);
      this.workOrderService.saveWorkOrders();
      this.newTaskForm.reset({
        description: '',
        priority: 'preventiva',
        assignedTechnician: '',
      });
    }
  }

  getTasksByStatus(status: string): number {
    if (!this.selectedOrder) return 0;
    return this.selectedOrder.tasks.filter((t) => t.status === status).length;
  }
}
