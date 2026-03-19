import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { CapoturnoSession } from '../../services/auth.service';
import { CapoturnoSessionService } from '../../services/capoturno-session.service';
import { TechnicianService, Technician } from '../../services/technician.service';
import {
  Task,
  WorkOrder,
  WorkOrderService,
} from '../../services/work-order.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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
        <div class="selected-order-card">
          <div class="selected-order-top">
            <div>
              <h1 class="train-number">Treno {{ selectedOrder.trainNumber }}</h1>
              <p class="work-order-info">
                {{ selectedOrder.codiceODL }} · Turno: {{ selectedOrder.shift }}
              </p>
            </div>
            <div class="header-actions">
              <button class="btn btn-secondary" type="button">📋 Copia codice tecnico</button>
              <button
                class="btn btn-danger"
                type="button"
                (click)="cancelWorkOrder()"
                [disabled]="!canCancelOrder() || orderCancellationInProgress"
              >
                {{ orderCancellationInProgress ? 'Annullamento...' : '🗑️ Annulla ODL' }}
              </button>
            </div>
          </div>
          <div class="order-meta-grid">
            <div class="meta-item">
              <span class="meta-label">Stato</span>
              <span class="status-pill" [ngClass]="selectedOrder.status">{{ selectedOrder.status | titlecase }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Creato il</span>
              <span class="meta-value">{{ selectedOrder.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Codice ODL</span>
              <span class="meta-value">{{ selectedOrder.codiceODL }}</span>
            </div>
          </div>
          <div class="order-progress">
            <div class="progress-label">
              <span>Avanzamento</span>
              <span>{{ getCompletionRate() }}%</span>
            </div>
            <div class="progress-track">
              <span class="progress-bar" [style.width.%]="getCompletionRate()"></span>
            </div>
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

        <!-- New Task Form -->
        <div class="section new-task-panel">
          <div class="section-header">
            <div>
              <span class="section-label">Nuova lavorazione</span>
              <p class="section-subtitle">
                Inserisci il dettaglio e assegna un tecnico prima di confermare.
              </p>
            </div>
            <div class="status-indicator">
              <span class="status-dot"></span>
              In attesa di compilazione
            </div>
          </div>
          <form [formGroup]="newTaskForm" (ngSubmit)="onAddTask()" class="task-form">
        <div class="form-grid">
              <label class="field-group">
                <span class="field-label">Descrizione attività</span>
                <input
                  type="text"
                  placeholder="Esempio: Verifica impianto frenante"
                  formControlName="description"
                  class="task-input"
                />
              </label>
              <label class="field-group">
                <span class="field-label">Priorità</span>
                <select formControlName="priority" class="task-input">
                  <option value="preventiva">Preventiva</option>
                  <option value="correttiva">Correttiva</option>
                  <option value="urgente">Urgente</option>
                </select>
              </label>
              <label class="field-group">
                <span class="field-label">Tecnico assegnato</span>
                <select formControlName="assignedTechnicianId" class="task-input">
                  <option value="" disabled>Seleziona un tecnico</option>
                  <option *ngFor="let tech of technicians$ | async" [value]="tech.id">
                    {{ tech.name }} · {{ tech.team }}
                  </option>
                </select>
              </label>
            </div>
            <div class="form-actions">
              <span class="helper-text">
                Gli ordini vengono salvati localmente finché non premi «Aggiungi».
              </span>
              <button type="submit" class="btn btn-add" [disabled]="newTaskForm.invalid">
                Aggiungi lavorazione
              </button>
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
            <ng-container *ngIf="editingTaskId !== task.id; else editTaskBlock">
              <div class="task-content">
                <div class="task-title">{{ task.description }}</div>
                <div class="task-meta">
                  {{ task.priority | titlecase }} · Assegnata a: {{ task.assignedTechnicianName }}
                </div>
              </div>
              <div class="task-actions">
                <span class="task-status">{{ task.status }}</span>
                <button class="btn btn-secondary" type="button" (click)="startEditTask(task)">
                  Modifica
                </button>
              </div>
            </ng-container>
            <ng-template #editTaskBlock>
              <div class="task-edit-grid">
                <label class="task-field">
                  <span class="task-label">Descrizione</span>
                  <input
                    type="text"
                    class="task-input"
                    [(ngModel)]="editTaskDraft.description"
                    [ngModelOptions]="{ standalone: true }"
                  />
                </label>
                <label class="task-field">
                  <span class="task-label">Priorità</span>
                  <select
                    class="task-input"
                    [(ngModel)]="editTaskDraft.priority"
                    [ngModelOptions]="{ standalone: true }"
                  >
                    <option *ngFor="let option of priorityOptions" [value]="option">
                      {{ option | titlecase }}
                    </option>
                  </select>
                </label>
                <label class="task-field">
                  <span class="task-label">Tecnico</span>
                  <select
                    class="task-input"
                    [(ngModel)]="editTaskDraft.assignedTechnicianId"
                    [ngModelOptions]="{ standalone: true }"
                  >
                    <option value="">Seleziona tecnico</option>
                    <option *ngFor="let tech of technicianList" [value]="tech.id">
                      {{ tech.name }}
                    </option>
                  </select>
                </label>
                <label class="task-field">
                  <span class="task-label">Stato</span>
                  <select
                    class="task-input"
                    [(ngModel)]="editTaskDraft.status"
                    [ngModelOptions]="{ standalone: true }"
                  >
                  <option *ngFor="let option of statusOptions" [value]="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>
                <div class="task-edit-actions">
                  <button class="btn btn-primary" type="button" (click)="saveTaskEdits(task)">
                    Salva
                  </button>
                  <button class="btn btn-secondary" type="button" (click)="cancelEditTask()">
                    Annulla
                  </button>
                </div>
              </div>
            </ng-template>
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

      .selected-order-card {
        background: linear-gradient(180deg, rgba(12, 15, 30, 0.95), rgba(20, 26, 46, 0.95));
        border-radius: 26px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 24px;
        box-shadow: 0 25px 45px rgba(1, 7, 20, 0.75);
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .selected-order-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 18px;
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

      .order-meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
      }

      .meta-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .meta-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--text-secondary);
      }

      .meta-value {
        font-size: 15px;
        font-weight: 600;
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 11px;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        background: rgba(255, 255, 255, 0.08);
      }

      .status-pill.pending {
        color: #ffd36b;
      }

      .status-pill.active {
        color: #60a5fa;
      }

      .status-pill.completed {
        color: #6ee4a4;
      }

      .status-pill.cancelled {
        color: #ff6c6c;
      }

      .order-progress {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .progress-label {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: var(--text-secondary);
      }

      .progress-track {
        width: 100%;
        height: 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        overflow: hidden;
      }

      .progress-bar {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #7bc7ff, #4b7bf5);
        transition: width 0.3s ease;
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

      .new-task-panel {
        background: linear-gradient(180deg, rgba(14, 19, 36, 0.92), rgba(22, 30, 50, 0.95));
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 22px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .new-task-panel .section-header {
        padding-bottom: 0;
        border-bottom: none;
        margin-bottom: 10px;
      }

      .section-label {
        font-size: 12px;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: var(--text-secondary);
      }

      .section-subtitle {
        font-size: 13px;
        color: var(--text-muted);
        margin: 4px 0 0;
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: var(--text-secondary);
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--accent-lime);
      }

      .status-dot.active {
        background: #7bc7ff;
      }

      .task-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
      }

      .field-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 12px;
        color: var(--text-secondary);
      }

      .field-label {
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }

      .form-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      }

      .helper-text {
        font-size: 12px;
        color: var(--text-muted);
      }

      .task-input {
        border-radius: 14px;
        background: rgba(17, 22, 35, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 12px;
        color: var(--text-primary);
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
        gap: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 15px 40px rgba(1, 8, 20, 0.6);
        display: flex;
        justify-content: space-between;
        align-items: center;
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

      .task-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
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

      .task-edit-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        width: 100%;
      }

      .task-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 12px;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .task-label {
        font-size: 11px;
      }

      .task-input {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: var(--text-primary);
        padding: 10px 12px;
        font-size: 13px;
        text-transform: none;
        letter-spacing: 0.2px;
      }

      .task-edit-actions {
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: flex-end;
      }

      @media (max-width: 768px) {
        .selected-order-top {
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
export class DashboardComponent implements OnInit, OnDestroy {
  newTaskForm: FormGroup;
  selectedOrder: WorkOrder | null = null;
  technicians$: Observable<Technician[]>;
  technicianList: Technician[] = [];
  capoturnoName = 'Capoturno';
  capoturnoSession: CapoturnoSession | null = null;
  readonly priorityOptions: Task['priority'][] = ['preventiva', 'correttiva', 'urgente'];
  readonly statusOptions: Array<{ value: Task['status']; label: string }> = [
    { value: 'aperta', label: 'Aperta' },
    { value: 'in_progress', label: 'In corso' },
    { value: 'risolte', label: 'Risolte' },
    { value: 'parziali', label: 'Parziali' },
  ];
  editingTaskId: string | null = null;
  editTaskDraft: {
    description: string;
    priority: Task['priority'];
    assignedTechnicianId: string;
    status: Task['status'];
  } = {
    description: '',
    priority: 'preventiva',
    assignedTechnicianId: '',
    status: 'aperta',
  };
  private techniciansSub?: Subscription;
  private capoturnoSessionSub?: Subscription;
  orderCancellationInProgress = false;

  constructor(
    private fb: FormBuilder,
    private workOrderService: WorkOrderService,
    private technicianService: TechnicianService,
    private capoturnoSessionService: CapoturnoSessionService,
  ) {
    this.newTaskForm = this.fb.group({
      description: ['', Validators.required],
      priority: ['preventiva', Validators.required],
      assignedTechnicianId: ['', Validators.required],
    });
    this.technicians$ = this.technicianService.getTechnicians();
    this.techniciansSub = this.technicians$.subscribe((list) => {
      this.technicianList = list;
    });
  }

  ngOnInit(): void {
    this.workOrderService.getSelectedWorkOrder().subscribe((order) => {
      this.selectedOrder = order;
    this.newTaskForm.reset({
      description: '',
      priority: 'preventiva',
      assignedTechnicianId: '',
    });
    });
    this.capoturnoSessionSub = this.capoturnoSessionService.getSession().subscribe((session) => {
      this.capoturnoSession = session;
      this.capoturnoName = session?.name ?? 'Capoturno';
    });
  }

  onAddTask(): void {
    if (this.newTaskForm.valid && this.selectedOrder?.id) {
      const technicianId = this.newTaskForm.value.assignedTechnicianId as string;
      const technician = this.technicianList.find((tech) => tech.id === technicianId);
      const taskPayload: Omit<Task, 'id' | 'status'> = {
        description: this.newTaskForm.value.description,
        priority: this.newTaskForm.value.priority,
        assignedTechnicianId: technicianId,
        assignedTechnicianName: technician?.name ?? '',
        assignedTechnicianNickname: technician?.nickname ?? technician?.name ?? '',
      };
      this.workOrderService.addTask(this.selectedOrder.id, taskPayload);
      this.workOrderService.saveWorkOrders();
      this.newTaskForm.reset({
        description: '',
        priority: 'preventiva',
        assignedTechnician: '',
      });
    }
  }

  startEditTask(task: Task): void {
    this.editingTaskId = task.id;
    this.editTaskDraft = {
      description: task.description,
      priority: task.priority,
      assignedTechnicianId: task.assignedTechnicianId ?? '',
      status: task.status,
    };
  }

  cancelEditTask(): void {
    this.editingTaskId = null;
  }

  saveTaskEdits(task: Task): void {
    if (!this.selectedOrder) {
      return;
    }
    const technician = this.technicianList.find(
      (tech) => tech.id === this.editTaskDraft.assignedTechnicianId,
    );
    this.workOrderService.updateTask(this.selectedOrder.id, task.id, {
      description: this.editTaskDraft.description,
      priority: this.editTaskDraft.priority,
      status: this.editTaskDraft.status,
      assignedTechnicianId: this.editTaskDraft.assignedTechnicianId,
      assignedTechnicianName: technician?.name ?? '',
      assignedTechnicianNickname: technician?.nickname ?? technician?.name ?? '',
    });
    this.editingTaskId = null;
  }


  getCompletionRate(): number {
    if (!this.selectedOrder) {
      return 0;
    }
    const total = this.selectedOrder.tasks.length;
    if (!total) {
      return 0;
    }
    const resolved = this.getTasksByStatus('risolte');
    return Math.round((resolved / total) * 100);
  }

  getTasksByStatus(status: string): number {
    if (!this.selectedOrder) return 0;
    return this.selectedOrder.tasks.filter((t) => t.status === status).length;
  }

  ngOnDestroy(): void {
    this.techniciansSub?.unsubscribe();
    this.capoturnoSessionSub?.unsubscribe();
  }

  cancelWorkOrder(): void {
    if (!this.selectedOrder || !this.canCancelOrder()) {
      return;
    }
    const confirmed = window.confirm(
      `Sei sicuro di voler annullare l'ordine ${this.selectedOrder.codiceODL}?`,
    );
    if (!confirmed) {
      return;
    }
    this.orderCancellationInProgress = true;
    this.workOrderService.cancelWorkOrder(this.selectedOrder.id).subscribe({
      next: () => {
        this.orderCancellationInProgress = false;
      },
      error: () => {
        this.orderCancellationInProgress = false;
      },
    });
  }

  canCancelOrder(): boolean {
    return (
      !!this.selectedOrder &&
      this.selectedOrder.status !== 'completed' &&
      this.selectedOrder.status !== 'cancelled'
    );
  }
}
