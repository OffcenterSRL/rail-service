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
        padding: 12px 0;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        gap: 16px;
        text-align: center;
        background: rgba(15, 20, 34, 0.8);
        border-radius: 18px;
        border: 1px dashed rgba(255, 255, 255, 0.2);
        padding: 32px;
        box-shadow: var(--glass-shadow);
      }

      .empty-icon {
        font-size: 64px;
        opacity: 0.6;
      }

      .empty-title {
        font-size: 22px;
        color: var(--text-primary);
        margin: 0;
        font-weight: 600;
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
        gap: 18px;
        padding: 16px 20px;
        border-radius: 20px;
        background: linear-gradient(180deg, rgba(10, 12, 30, 0.95), rgba(33, 35, 53, 0.95));
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: var(--glass-shadow);
      }

      .train-number {
        font-size: 30px;
        font-weight: 700;
        margin: 0 0 6px 0;
      }

      .work-order-info {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 0;
      }

      .header-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .btn {
        padding: 10px 16px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 600;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        border: 1px solid transparent;
        background: rgba(255, 255, 255, 0.04);
      }

      .btn-primary {
        background: linear-gradient(180deg, #7bc7ff, #4b6ef5);
        color: #030712;
        box-shadow: 0 10px 20px rgba(75, 110, 245, 0.35);
      }

      .btn-primary:hover {
        transform: translateY(-1px);
      }

      .btn-secondary {
        background: rgba(255, 255, 255, 0.04);
        color: var(--text-secondary);
      }

      .btn-secondary:hover {
        transform: translateY(-1px);
      }

      .btn-danger {
        background: linear-gradient(180deg, #ff8e3a, #ff5d1e);
        color: #08040a;
      }

      .btn-danger:hover {
        transform: translateY(-1px);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .stat-card {
        background: rgba(255, 255, 255, 0.02);
        border-radius: 18px;
        padding: 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 20px 35px rgba(1, 6, 16, 0.75);
        display: flex;
        gap: 14px;
        align-items: center;
      }

      .stat-badge {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .stat-badge.totale {
        background-color: #60a5fa;
      }

      .stat-badge.risolte {
        background-color: var(--success);
      }

      .stat-badge.parziali {
        background-color: var(--accent-orange);
      }

      .stat-badge.attesa {
        background-color: var(--error);
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .stat-label {
        font-size: 11px;
        text-transform: uppercase;
        color: var(--text-secondary);
        letter-spacing: 1px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 700;
      }

      .work-order-code {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 18px;
        padding: 16px 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        gap: 14px;
        font-size: 13px;
        color: var(--text-secondary);
        box-shadow: 0 16px 30px rgba(0, 0, 0, 0.5);
      }

      .code-icon {
        font-size: 22px;
      }

      .code-text {
        flex: 1;
      }

      .code-text strong {
        color: var(--accent-orange);
      }

      .section {
        background: rgba(15, 20, 34, 0.8);
        border-radius: 20px;
        padding: 16px 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: var(--glass-shadow);
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
        gap: 14px;
      }

      .form-row {
        display: flex;
        gap: 12px;
        align-items: flex-end;
        flex-wrap: wrap;
      }

      .form-group {
        flex: 1;
        min-width: 200px;
      }

      .form-group.full-width {
        flex: 1 1 100%;
      }

      .task-input {
        border-radius: 14px;
        background: rgba(17, 22, 35, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .btn-add {
        background: linear-gradient(180deg, #ff8e3a, #ff5d1e);
        color: #0c0602;
        border-radius: 999px;
        padding: 10px 18px;
        font-weight: 600;
      }

      .tasks-empty {
        padding: 16px;
        text-align: center;
        color: var(--text-secondary);
        font-size: 14px;
      }

      .task-item {
        background: rgba(255, 255, 255, 0.02);
        border-radius: 18px;
        padding: 14px 18px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 15px 40px rgba(1, 8, 20, 0.6);
      }

      .task-content {
        flex: 1;
      }

      .task-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      .task-meta {
        font-size: 12px;
        color: var(--text-secondary);
      }

      .task-status {
        font-size: 12px;
        color: var(--text-primary);
        padding: 6px 12px;
        border-radius: 12px;
        background: rgba(124, 199, 255, 0.1);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      @media (max-width: 768px) {
        .work-order-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .header-actions {
          width: 100%;
          justify-content: flex-start;
        }

        .stats-grid {
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }
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
