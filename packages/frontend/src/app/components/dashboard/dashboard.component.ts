import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { AuthService, CapoturnoSession } from '../../services/auth.service';
import { CapoturnoSessionService } from '../../services/capoturno-session.service';
import {
  MaterialRequestExportService,
  MaterialRequestLineFields,
  MaterialRequestSharedFields,
} from '../../services/material-request-export.service';
import { TechnicianService, Technician } from '../../services/technician.service';
import {
  Task,
  WorkOrder,
  WorkOrderService,
} from '../../services/work-order.service';

interface MaterialItem {
  tavola: string;
  codice_fs: string;
  descrizione: string;
  riferimento: string;
  codice_fornitore: string;
  codice_ditta_documento: string;
  numero_documento: string;
  segno_matr_pos: string;
  numero_pezzi: string;
  unita_conto: string;
  note: string;
  source_pdf: string;
  source_page: string;
}

interface MaterialRequestLineDraft {
  item: MaterialItem;
  key: string;
  avviso: string;
  guasto: string;
  quantity: string;
  tipoIntervento: string;
  um: string;
}

type MaterialsRequestStep = 'select' | 'details';

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
              <button
                class="btn btn-danger btn-add-compact"
                type="button"
                (click)="cancelWorkOrder()"
                [disabled]="!canCancelOrder() || orderCancellationInProgress"
              >
                {{ orderCancellationInProgress ? 'Annullamento...' : 'Annulla ODL' }}
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

          <div class="stats-row">
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
                <div class="stat-badge in-corso"></div>
                <div class="stat-content">
                  <span class="stat-label">IN CORSO</span>
                  <span class="stat-value">{{ getTasksByStatus('in_progress') }}</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-badge rimandate"></div>
                <div class="stat-content">
                  <span class="stat-label">RIMANDATE</span>
                  <span class="stat-value">{{ getTasksByStatus('rimandato') }}</span>
                </div>
              </div>
            </div>
            <div class="stats-actions">
              <button
                class="btn btn-secondary btn-add-compact"
                type="button"
                (click)="openMaterialsRequestModal()"
              >
                Richiesta materiali
              </button>
              <button class="btn btn-add btn-add-compact" type="button" (click)="openNewTaskModal()">
                Aggiungi lavorazione
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="isNewTaskModalOpen" class="modal-backdrop" (click)="closeNewTaskModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <span class="section-label">Nuova lavorazione</span>
                <p class="section-subtitle">
                  Inserisci il dettaglio e assegna un tecnico prima di confermare.
                </p>
              </div>
              <div class="modal-actions">
                <div class="status-indicator">
                  <span class="status-dot"></span>
                  In attesa di compilazione
                </div>
                <button class="btn btn-secondary btn-close" type="button" (click)="closeNewTaskModal()">
                  Chiudi
                </button>
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
                <label
                  class="field-group"
                  *ngIf="newTaskForm.value.priority === 'preventiva'"
                >
                  <span class="field-label">Tipo preventiva</span>
                  <select formControlName="preventiveType" class="task-input">
                    <option value="" disabled>Seleziona preventiva</option>
                    <option *ngFor="let option of preventiveOptions" [value]="option.label">
                      {{ option.label }}
                    </option>
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
        </div>

        <div
          *ngIf="isMaterialsRequestModalOpen"
          class="modal-backdrop"
          (click)="closeMaterialsRequestModal()"
        >
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <span class="section-label">Richiesta materiali</span>
                <p class="section-subtitle">
                  {{
                    materialsRequestStep === 'select'
                      ? 'Seleziona l’intervento e i materiali da inserire nella richiesta.'
                      : 'Completa i campi obbligatori e genera il file Excel già compilato.'
                  }}
                </p>
              </div>
              <div class="modal-actions">
                <div *ngIf="materialsRequestExportError" class="helper-text materials-request-error">
                  {{ materialsRequestExportError }}
                </div>
                <button
                  class="btn btn-secondary btn-close"
                  type="button"
                  (click)="closeMaterialsRequestModal()"
                  [disabled]="materialsRequestExportInProgress"
                >
                  Chiudi
                </button>
              </div>
            </div>
            <div class="task-form">
              <ng-container *ngIf="materialsRequestStep === 'select'; else materialsRequestDetailsStep">
                <label class="field-group">
                  <span class="field-label">Intervento</span>
                  <select
                    class="task-input"
                    [(ngModel)]="materialsRequestTaskId"
                    [ngModelOptions]="{ standalone: true }"
                  >
                    <option value="" disabled>Seleziona lavorazione</option>
                    <option *ngFor="let task of selectedOrder?.tasks" [value]="task.id">
                      {{ task.description }}
                    </option>
                  </select>
                </label>
                <label class="field-group materials-search">
                  <span class="field-label">Cerca materiale</span>
                  <input
                    type="text"
                    class="task-input"
                    placeholder="Descrizione o codice articolo"
                    [(ngModel)]="materialsSearchQuery"
                    [ngModelOptions]="{ standalone: true }"
                    (input)="onMaterialsSearchChange()"
                  />
                </label>
                <div class="materials-results">
                  <div *ngIf="materialsLoading" class="helper-text">Caricamento elenco...</div>
                  <div *ngIf="materialsError" class="helper-text">{{ materialsError }}</div>
                  <div *ngIf="!materialsLoading && !materialsError">
                    <div *ngIf="selectedMaterials.length" class="materials-selected">
                      <div class="materials-selected-title">
                        Selezionati ({{ selectedMaterials.length }})
                      </div>
                      <div class="materials-selected-list">
                        <div
                          *ngFor="let item of selectedMaterials"
                          class="materials-selected-row"
                        >
                          <div class="materials-desc">{{ item.descrizione }}</div>
                          <div class="materials-code">{{ item.numero_documento || '-' }}</div>
                          <div class="materials-meta">{{ item.numero_pezzi || '-' }}</div>
                          <div class="materials-file">
                            <a
                              *ngIf="item.source_pdf"
                              [attr.href]="getMaterialFileUrl(item)"
                              target="_blank"
                              rel="noopener"
                            >
                              Apri
                            </a>
                            <span *ngIf="!item.source_pdf">-</span>
                          </div>
                          <button
                            class="btn btn-secondary btn-remove"
                            type="button"
                            (click)="removeSelectedMaterial(item)"
                          >
                            Rimuovi
                          </button>
                        </div>
                      </div>
                    </div>
                    <div class="materials-header">
                      <span>Descrizione</span>
                      <span>Numero</span>
                      <span>Pezzi</span>
                      <span>File</span>
                    </div>
                    <div
                      *ngFor="let item of materialsResults"
                      class="materials-row"
                      [class.selected]="isMaterialSelected(item)"
                      (click)="toggleMaterialSelection(item)"
                    >
                      <div class="materials-desc">{{ item.descrizione }}</div>
                      <div class="materials-code">{{ item.numero_documento || '-' }}</div>
                      <div class="materials-meta">{{ item.numero_pezzi || '-' }}</div>
                      <div class="materials-file">
                        <a
                          *ngIf="item.source_pdf"
                          [attr.href]="getMaterialFileUrl(item)"
                          target="_blank"
                          rel="noopener"
                          (click)="$event.stopPropagation()"
                        >
                          Apri
                        </a>
                        <span *ngIf="!item.source_pdf">-</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="form-actions materials-actions">
                  <span class="helper-text">
                    Seleziona una lavorazione e almeno un materiale per continuare.
                  </span>
                  <button
                    type="button"
                    class="btn btn-add"
                    (click)="proceedToMaterialsRequestDetails()"
                    [disabled]="!canProceedToMaterialsRequestDetails()"
                  >
                    Avanti
                  </button>
                </div>
              </ng-container>

              <ng-template #materialsRequestDetailsStep>
                <div class="materials-request-summary">
                  <div class="materials-request-summary-card">
                    <span class="materials-request-summary-label">Intervento</span>
                    <strong>{{ getSelectedMaterialsTaskDescription() }}</strong>
                  </div>
                  <div class="materials-request-summary-card">
                    <span class="materials-request-summary-label">Materiali</span>
                    <strong>{{ selectedMaterials.length }}</strong>
                  </div>
                  <div class="materials-request-summary-card">
                    <span class="materials-request-summary-label">Treno</span>
                    <strong>{{ selectedOrder.trainNumber }}</strong>
                  </div>
                </div>

                <div class="materials-request-shared-row">
                  <label class="field-group">
                    <span class="field-label">Cassa</span>
                    <input
                      type="text"
                      class="task-input"
                      [(ngModel)]="materialsRequestSharedDraft.cassa"
                      [ngModelOptions]="{ standalone: true }"
                    />
                  </label>
                  <label class="field-group">
                    <span class="field-label">Note</span>
                    <input
                      type="text"
                      class="task-input"
                      placeholder="Opzionale"
                      [(ngModel)]="materialsRequestSharedDraft.note"
                      [ngModelOptions]="{ standalone: true }"
                    />
                  </label>
                </div>

                <div class="materials-request-lines">
                  <div
                    *ngFor="let line of materialsRequestLineDrafts"
                    class="materials-request-line"
                  >
                    <div class="materials-request-line-info">
                      <div class="materials-desc">{{ line.item.descrizione }}</div>
                      <div class="materials-line-detail">
                        {{ line.item.numero_documento || line.item.codice_ditta_documento || line.item.codice_fs || '-' }}
                        · Tav. {{ line.item.tavola || '-' }} · Rif. {{ line.item.riferimento || '-' }}
                      </div>
                    </div>
                    <div class="materials-request-line-fields">
                      <label class="field-group materials-inline-field">
                        <span class="field-label">Avviso</span>
                        <input
                          type="text"
                          class="task-input"
                          [(ngModel)]="line.avviso"
                          [ngModelOptions]="{ standalone: true }"
                        />
                      </label>
                      <label class="field-group materials-inline-field">
                        <span class="field-label">Tipo di intervento</span>
                        <select
                          class="task-input"
                          [(ngModel)]="line.tipoIntervento"
                          [ngModelOptions]="{ standalone: true }"
                        >
                          <option value="" disabled>Seleziona tipo</option>
                          <option *ngFor="let option of materialsRequestTypeOptions" [value]="option">
                            {{ option }}
                          </option>
                        </select>
                      </label>
                      <label class="field-group materials-inline-field">
                        <span class="field-label">Guasto</span>
                        <input
                          type="text"
                          class="task-input"
                          [(ngModel)]="line.guasto"
                          [ngModelOptions]="{ standalone: true }"
                        />
                      </label>
                      <label class="field-group materials-inline-field">
                        <span class="field-label">Q.tà</span>
                        <input
                          type="text"
                          class="task-input"
                          [(ngModel)]="line.quantity"
                          [ngModelOptions]="{ standalone: true }"
                        />
                      </label>
                      <label class="field-group materials-inline-field">
                        <span class="field-label">UM</span>
                        <select
                          class="task-input"
                          [(ngModel)]="line.um"
                          [ngModelOptions]="{ standalone: true }"
                        >
                          <option value="" disabled>UM</option>
                          <option *ngFor="let option of materialsRequestUmOptions" [value]="option">
                            {{ option }}
                          </option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="form-actions materials-actions">
                  <button
                    type="button"
                    class="btn btn-secondary"
                    (click)="backToMaterialsRequestSelection()"
                    [disabled]="materialsRequestExportInProgress"
                  >
                    Indietro
                  </button>
                  <button
                    type="button"
                    class="btn btn-add"
                    (click)="exportMaterialsRequest()"
                    [disabled]="!canExportMaterialsRequest() || materialsRequestExportInProgress"
                  >
                    {{
                      materialsRequestExportInProgress
                        ? 'Generazione in corso...'
                        : 'Genera file Excel'
                    }}
                  </button>
                </div>
              </ng-template>
            </div>
          </div>
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
                  <span *ngIf="task.preventiveType" class="task-preventive">
                    · {{ task.preventiveType }}
                  </span>
                  <span
                    *ngIf="task.status === 'rimandato' && task.deferredSince"
                    class="task-deferred"
                  >
                    · Rimandato {{ task.deferredCount ?? 1 }} volte dal
                    {{ task.deferredSince | date: 'dd/MM/yyyy' }}
                  </span>
                </div>
              </div>
              <div class="task-actions">
                <span class="task-status" [ngClass]="getTaskStatusClass(task.status)">
                  {{ getTaskStatusLabel(task.status) }}
                </span>
                <button
                  *ngIf="task.preventiveType"
                  class="btn btn-secondary"
                  type="button"
                  (click)="openPreventiveFile(task.preventiveType)"
                >
                  Stampa
                </button>
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
        background: linear-gradient(180deg, #f87171, #ef4444);
        color: #0b0505;
      }

      .btn-danger:hover {
        transform: translateY(-1px);
      }

      .stats-grid {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: nowrap;
        margin-top: 12px;
        flex: 1;
        justify-content: flex-start;
        max-width: 60%;
      }

      .stats-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .stat-card {
        background: rgba(255, 255, 255, 0.02);
        border-radius: 12px;
        padding: 8px 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 8px 14px rgba(1, 6, 16, 0.45);
        display: flex;
        gap: 6px;
        align-items: center;
        flex: 1;
        min-width: 120px;
        max-width: 180px;
        justify-content: flex-start;
        min-height: 32px;
      }

      .stat-badge {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .stat-badge.totale {
        background-color: #60a5fa;
      }

      .stat-badge.risolte {
        background-color: #22c55e;
        box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
      }

      .stat-badge.in-corso {
        background-color: #facc15;
      }

      .stat-badge.rimandate {
        background-color: #ef4444;
        box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
      }

      .stat-content {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .stat-label {
        font-size: 9px;
        text-transform: uppercase;
        color: var(--text-secondary);
        letter-spacing: 0.6px;
      }

      .stat-value {
        font-size: 12px;
        font-weight: 700;
      }

      .btn-add-compact {
        height: 32px;
        padding: 0 14px;
        font-size: 12px;
        white-space: nowrap;
        margin-left: auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .stats-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
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

      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(8, 12, 24, 0.75);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        z-index: 40;
      }

      .modal-card {
        width: min(1100px, 100%);
        background: linear-gradient(180deg, rgba(14, 19, 36, 0.95), rgba(22, 30, 50, 0.98));
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 18px;
        box-shadow: 0 30px 70px rgba(3, 8, 18, 0.8);
        padding: 22px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }

      .modal-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .btn-close {
        padding: 8px 12px;
        font-size: 12px;
      }

      .materials-search {
        margin-top: 6px;
      }

      .materials-actions {
        margin-top: 8px;
      }

      .materials-results {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 320px;
        overflow: auto;
        padding-right: 4px;
      }

      .materials-selected {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 10px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .materials-selected-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: var(--text-secondary);
      }

      .materials-selected-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .materials-selected-row {
        display: grid;
        grid-template-columns: 1fr 180px 120px 80px auto;
        gap: 10px;
        align-items: center;
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.02);
        font-size: 12px;
      }

      .materials-header {
        display: grid;
        grid-template-columns: 1fr 180px 120px 80px;
        gap: 10px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: var(--text-secondary);
        padding: 0 10px;
      }

      .materials-row {
        display: grid;
        grid-template-columns: 1fr 180px 120px 80px;
        gap: 10px;
        align-items: center;
        padding: 8px 10px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.02);
        font-size: 12px;
        cursor: pointer;
        transition: border-color 0.2s ease, background 0.2s ease;
      }

      .materials-row:hover {
        border-color: rgba(255, 255, 255, 0.2);
      }

      .materials-row.selected {
        border-color: rgba(251, 146, 60, 0.6);
        background: rgba(251, 146, 60, 0.12);
      }

      .btn-remove {
        height: 28px;
        padding: 0 10px;
        font-size: 11px;
      }

      .materials-code {
        font-weight: 600;
        color: var(--text-secondary);
      }

      .materials-desc {
        color: var(--text-primary);
      }

      .materials-meta {
        color: var(--text-secondary);
        text-align: right;
      }

      .materials-file {
        color: #7ab7ff;
        text-align: right;
      }

      .materials-file a {
        color: inherit;
        text-decoration: underline;
      }

      .materials-request-error {
        max-width: 280px;
        text-align: right;
      }

      .materials-request-summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .materials-request-summary-card {
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.03);
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .materials-request-summary-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: var(--text-secondary);
      }

      .materials-request-shared-row {
        display: grid;
        grid-template-columns: 240px minmax(0, 1fr);
        gap: 12px;
      }

      .materials-request-lines {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .materials-request-line {
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.03);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .materials-request-line-info {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .materials-request-line-fields {
        display: grid;
        grid-template-columns: 140px minmax(160px, 1fr) minmax(140px, 1fr) 110px 120px;
        gap: 10px;
        align-items: end;
      }

      .materials-line-detail {
        font-size: 11px;
        color: var(--text-secondary);
      }

      .materials-inline-field {
        margin: 0;
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

      .task-preventive {
        color: rgba(125, 211, 252, 0.9);
      }

      .task-deferred {
        color: rgba(252, 211, 77, 0.95);
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

      .task-status.in_progress {
        color: #facc15;
        background: rgba(250, 204, 21, 0.12);
        border: 1px solid rgba(250, 204, 21, 0.25);
      }

      .task-status.risolte {
        color: #22c55e;
        background: rgba(34, 197, 94, 0.12);
        border: 1px solid rgba(34, 197, 94, 0.25);
      }

      .task-status.rimandato {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.25);
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
          flex-wrap: wrap;
        }

        .stats-row {
          flex-direction: column;
          align-items: flex-start;
        }

        .stats-grid {
          max-width: 100%;
        }

        .stats-actions {
          width: 100%;
          justify-content: flex-start;
        }

        .btn-add-compact {
          margin-left: 0;
        }

        .materials-row {
          grid-template-columns: 1fr;
          gap: 4px;
        }

        .materials-header {
          grid-template-columns: 1fr;
          gap: 4px;
        }

        .materials-selected-row {
          grid-template-columns: 1fr;
          gap: 4px;
        }

        .materials-meta {
          text-align: left;
        }

        .materials-file {
          text-align: left;
        }

        .materials-request-summary {
          grid-template-columns: 1fr;
        }

        .materials-request-line-fields {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 600px) {
        .selected-order-card {
          padding: 16px;
          border-radius: 18px;
        }

        .train-number {
          font-size: 22px;
        }

        .order-meta-grid {
          grid-template-columns: 1fr;
        }

        .header-actions {
          flex-direction: column;
          align-items: stretch;
        }

        .stats-actions {
          width: 100%;
        }

        .stats-actions .btn {
          width: 100%;
        }

        .task-item {
          flex-direction: column;
          align-items: flex-start;
        }

        .task-actions {
          width: 100%;
          justify-content: flex-start;
        }

        .task-edit-actions {
          flex-direction: column;
          align-items: stretch;
        }

        .modal-card {
          width: 100%;
          max-height: 90vh;
          overflow: auto;
          border-radius: 16px;
          padding: 16px;
        }

        .materials-request-line-fields {
          grid-template-columns: 1fr;
        }

        .materials-request-shared-row {
          grid-template-columns: 1fr;
        }

        .modal-header {
          flex-direction: column;
          align-items: flex-start;
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
  readonly preventiveOptions = [
    { label: '2RT', fileName: '2RT.pdf' },
    { label: '4RT', fileName: '4RT.pdf' },
    { label: '6M', fileName: '6M.pdf' },
    { label: '12M PWP', fileName: '12M PWP.pdf' },
    { label: '12M', fileName: '12M.pdf' },
    { label: '24M PWP', fileName: '24M PWP.pdf' },
    { label: '24M', fileName: '24M.pdf' },
    { label: '1000H', fileName: '1000H.pdf' },
    { label: '2000H', fileName: '2000H.pdf' },
    { label: '4000H', fileName: '4000H.pdf' },
    { label: '6000H', fileName: '6000H.pdf' },
    { label: '9000H', fileName: '9000H.pdf' },
    { label: 'PRE_EST', fileName: 'PRE_EST.pdf' },
    { label: 'PRE_INV', fileName: 'PRE_INV.pdf' },
    { label: 'REV2', fileName: 'REV2.pdf' },
    { label: 'RT', fileName: 'RT.pdf' },
    { label: 'VI', fileName: 'VI.pdf' },
  ];
  readonly statusOptions: Array<{ value: Task['status']; label: string }> = [
    { value: 'aperta', label: 'Aperta' },
    { value: 'in_progress', label: 'In corso' },
    { value: 'risolte', label: 'Risolte' },
    { value: 'rimandato', label: 'Rimandato' },
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
  isNewTaskModalOpen = false;
  isMaterialsRequestModalOpen = false;
  materialsLoading = false;
  materialsError = '';
  materialsSearchQuery = '';
  materialsResults: MaterialItem[] = [];
  materialsResultsCount = 0;
  materialsRequestStep: MaterialsRequestStep = 'select';
  materialsRequestTaskId = '';
  materialsRequestExportInProgress = false;
  materialsRequestExportError = '';
  readonly materialsRequestTypeOptions = ['Garanzia', 'Extra Garanzia'];
  readonly materialsRequestUmOptions = ['n°', 'kg', 'lt', 'mt', 'kit'];
  materialsRequestSharedDraft: MaterialRequestSharedFields = this.createEmptyMaterialsRequestSharedDraft();
  materialsRequestLineDrafts: MaterialRequestLineDraft[] = [];
  private materialsCatalog: MaterialItem[] = [];
  selectedMaterials: MaterialItem[] = [];

  constructor(
    private fb: FormBuilder,
    private workOrderService: WorkOrderService,
    private technicianService: TechnicianService,
    private capoturnoSessionService: CapoturnoSessionService,
    private authService: AuthService,
    private materialRequestExportService: MaterialRequestExportService,
  ) {
    this.newTaskForm = this.fb.group({
      description: ['', Validators.required],
      priority: ['preventiva', Validators.required],
      preventiveType: [''],
      assignedTechnicianId: ['', Validators.required],
    });
    this.newTaskForm.get('priority')?.valueChanges.subscribe((value) => {
      if (value !== 'preventiva') {
        this.newTaskForm.get('preventiveType')?.setValue('');
      }
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
      if (
        this.newTaskForm.value.priority === 'preventiva' &&
        !this.newTaskForm.value.preventiveType
      ) {
        this.newTaskForm.get('preventiveType')?.markAsTouched();
        return;
      }
      const technicianId = this.newTaskForm.value.assignedTechnicianId as string;
      const technician = this.technicianList.find((tech) => tech.id === technicianId);
      const taskPayload: Omit<Task, 'id' | 'status'> = {
        description: this.newTaskForm.value.description,
        priority: this.newTaskForm.value.priority,
        preventiveType: this.newTaskForm.value.preventiveType ?? undefined,
        assignedTechnicianId: technicianId,
        assignedTechnicianName: technician?.name ?? '',
        assignedTechnicianNickname: technician?.nickname ?? technician?.name ?? '',
      };
      this.workOrderService.addTask(this.selectedOrder.id, taskPayload);
      this.workOrderService.saveWorkOrders();
      this.newTaskForm.reset({
        description: '',
        priority: 'preventiva',
        preventiveType: '',
        assignedTechnicianId: '',
      });
      this.isNewTaskModalOpen = false;
    }
  }

  openNewTaskModal(): void {
    this.isNewTaskModalOpen = true;
  }

  closeNewTaskModal(): void {
    this.isNewTaskModalOpen = false;
  }

  openMaterialsRequestModal(): void {
    this.isMaterialsRequestModalOpen = true;
    this.resetMaterialsRequestState();
    if (!this.materialsCatalog.length) {
      this.loadMaterialsCatalog();
    } else {
      this.updateMaterialsResults();
    }
  }

  closeMaterialsRequestModal(): void {
    this.isMaterialsRequestModalOpen = false;
    this.resetMaterialsRequestState();
  }

  onMaterialsSearchChange(): void {
    this.updateMaterialsResults();
  }

  private loadMaterialsCatalog(): void {
    this.materialsLoading = true;
    this.materialsError = '';
    fetch('/assets/materials/materials.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Impossibile caricare il catalogo');
        }
        return res.json();
      })
      .then((data: MaterialItem[]) => {
        this.materialsCatalog = Array.isArray(data) ? data : [];
        this.updateMaterialsResults();
      })
      .catch(() => {
        this.materialsError = 'Errore nel caricamento del catalogo materiali.';
      })
      .finally(() => {
        this.materialsLoading = false;
      });
  }

  private updateMaterialsResults(): void {
    const query = this.materialsSearchQuery.trim().toLowerCase();
    let results = this.materialsCatalog;
    if (query.length >= 2) {
      results = results.filter((item) => this.matchesMaterialQuery(item, query));
    }
    this.materialsResultsCount = results.length;
    this.materialsResults = results.slice(0, 50);
  }

  private matchesMaterialQuery(item: MaterialItem, query: string): boolean {
    const fields = [
      item.descrizione,
      item.codice_fs,
      item.codice_fornitore,
      item.codice_ditta_documento,
      item.numero_documento,
      item.tavola,
      item.source_pdf,
    ];
    return fields.some((value) => value && value.toLowerCase().includes(query));
  }

  toggleMaterialSelection(item: MaterialItem): void {
    const key = this.getMaterialKey(item);
    const exists = this.selectedMaterials.find((m) => this.getMaterialKey(m) === key);
    if (exists) {
      this.selectedMaterials = this.selectedMaterials.filter(
        (m) => this.getMaterialKey(m) !== key,
      );
    } else {
      this.selectedMaterials = [item, ...this.selectedMaterials];
    }
  }

  removeSelectedMaterial(item: MaterialItem): void {
    const key = this.getMaterialKey(item);
    this.selectedMaterials = this.selectedMaterials.filter(
      (m) => this.getMaterialKey(m) !== key,
    );
    this.materialsRequestLineDrafts = this.materialsRequestLineDrafts.filter(
      (line) => line.key !== key,
    );
  }

  isMaterialSelected(item: MaterialItem): boolean {
    const key = this.getMaterialKey(item);
    return this.selectedMaterials.some((m) => this.getMaterialKey(m) === key);
  }

  private getMaterialKey(item: MaterialItem): string {
    return [
      item.numero_documento,
      item.codice_fs,
      item.codice_fornitore,
      item.codice_ditta_documento,
      item.descrizione,
      item.numero_pezzi,
      item.source_pdf,
      item.source_page,
    ]
      .filter((value) => value && value.trim())
      .join('|');
  }

  getMaterialFileUrl(item: MaterialItem): string {
    if (!item.source_pdf) {
      return '';
    }
    const encoded = encodeURIComponent(item.source_pdf);
    const page = item.source_page?.trim();
    const pageFragment = page ? `#page=${encodeURIComponent(page)}` : '';
    return `/assets/materials-pdf/${encoded}${pageFragment}`;
  }

  canProceedToMaterialsRequestDetails(): boolean {
    return Boolean(this.materialsRequestTaskId && this.selectedMaterials.length);
  }

  proceedToMaterialsRequestDetails(): void {
    if (!this.canProceedToMaterialsRequestDetails()) {
      this.materialsRequestExportError =
        'Seleziona una lavorazione e almeno un materiale prima di continuare.';
      return;
    }

    this.materialsRequestExportError = '';
    this.materialsRequestStep = 'details';
    this.syncMaterialsRequestLineDrafts();
  }

  backToMaterialsRequestSelection(): void {
    this.materialsRequestExportError = '';
    this.materialsRequestStep = 'select';
  }

  canExportMaterialsRequest(): boolean {
    const shared = this.materialsRequestSharedDraft;
    const sharedValid = Boolean(this.normalizeDraftValue(shared.cassa));

    const linesValid =
      this.materialsRequestLineDrafts.length > 0 &&
      this.materialsRequestLineDrafts.every(
        (line) =>
          Boolean(this.normalizeDraftValue(line.avviso)) &&
          Boolean(this.normalizeDraftValue(line.guasto)) &&
          Boolean(this.normalizeDraftValue(line.quantity)) &&
          Boolean(this.normalizeDraftValue(line.tipoIntervento)) &&
          Boolean(this.normalizeDraftValue(line.um)),
      );

    return sharedValid && linesValid;
  }

  async exportMaterialsRequest(): Promise<void> {
    if (!this.selectedOrder || !this.canExportMaterialsRequest()) {
      this.materialsRequestExportError =
        'Compila tutti i campi obbligatori prima di generare il file Excel.';
      return;
    }

    const lines = this.materialsRequestLineDrafts.reduce<Record<string, MaterialRequestLineFields>>(
      (accumulator, line) => {
        accumulator[line.key] = {
          avviso: this.normalizeDraftValue(line.avviso),
          guasto: this.normalizeDraftValue(line.guasto),
          tipoIntervento: this.normalizeDraftValue(line.tipoIntervento),
          quantity: this.normalizeDraftValue(line.quantity),
          um: this.normalizeDraftValue(line.um),
        };
        return accumulator;
      },
      {},
    );

    this.materialsRequestExportInProgress = true;
    this.materialsRequestExportError = '';

    try {
      await this.materialRequestExportService.exportRequest({
        order: this.selectedOrder,
        materials: this.selectedMaterials,
        shared: {
          cassa: this.normalizeDraftValue(this.materialsRequestSharedDraft.cassa),
          note: this.normalizeDraftValue(this.materialsRequestSharedDraft.note),
        },
        lines,
      });
      this.closeMaterialsRequestModal();
    } catch (error) {
      console.error(error);
      const detail = error instanceof Error ? error.message : String(error);
      this.materialsRequestExportError = `Errore: ${detail}`;
    } finally {
      this.materialsRequestExportInProgress = false;
    }
  }

  getSelectedMaterialsTaskDescription(): string {
    return (
      this.selectedOrder?.tasks.find((task) => task.id === this.materialsRequestTaskId)?.description ||
      '-'
    );
  }

  private resetMaterialsRequestState(): void {
    this.materialsRequestStep = 'select';
    this.materialsRequestTaskId = '';
    this.materialsSearchQuery = '';
    this.materialsRequestExportInProgress = false;
    this.materialsRequestExportError = '';
    this.materialsRequestSharedDraft = this.createEmptyMaterialsRequestSharedDraft();
    this.materialsRequestLineDrafts = [];
    this.selectedMaterials = [];
  }

  private createEmptyMaterialsRequestSharedDraft(): MaterialRequestSharedFields {
    return {
      cassa: '',
      note: '',
    };
  }

  private syncMaterialsRequestLineDrafts(): void {
    const existing = new Map(
      this.materialsRequestLineDrafts.map((line) => [line.key, line]),
    );

    this.materialsRequestLineDrafts = this.selectedMaterials.map((item) => {
      const key = this.getMaterialKey(item);
      const current = existing.get(key);
      return {
        item,
        key,
        avviso: current?.avviso ?? '',
        guasto: current?.guasto ?? '',
        quantity: current?.quantity ?? '',
        tipoIntervento: current?.tipoIntervento ?? '',
        um: current?.um ?? '',
      };
    });
  }

  private normalizeDraftValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).trim();
  }

  openPreventiveFile(type: string): void {
    const match = this.preventiveOptions.find((option) => option.label === type);
    const fileName = match?.fileName ?? `${type}.pdf`;
    const url = `/assets/preventive/${encodeURIComponent(fileName)}`;
    window.open(url, '_blank', 'noopener');
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
    const normalizedStatus = this.normalizeTaskStatus(this.editTaskDraft.status);
    this.workOrderService.updateTask(this.selectedOrder.id, task.id, {
      description: this.editTaskDraft.description,
      priority: this.editTaskDraft.priority,
      status: normalizedStatus,
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
    return this.selectedOrder.tasks.filter((t) => this.normalizeTaskStatus(t.status) === status)
      .length;
  }

  private normalizeTaskStatus(status: Task['status'] | string): Task['status'] {
    if (status === 'in_rpgress') {
      return 'in_progress';
    }
    if (status === 'In corso') {
      return 'in_progress';
    }
    return status as Task['status'];
  }

  getTaskStatusClass(status: Task['status'] | string): Task['status'] {
    return this.normalizeTaskStatus(status);
  }

  getTaskStatusLabel(status: Task['status'] | string): string {
    const normalized = this.normalizeTaskStatus(status);
    if (normalized === 'in_progress') return 'In corso';
    if (normalized === 'risolte') return 'Risolte';
    if (normalized === 'rimandato') return 'Rimandato';
    return 'Aperta';
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
    const session = this.capoturnoSession;
    if (!session) {
      window.alert('Sessione capoturno non valida. Effettua di nuovo il login.');
      return;
    }
    const password = window.prompt(
      `Conferma l'annullamento inserendo la password dell'account ${session.nickname}:`,
    );
    if (password === null) {
      return;
    }
    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      window.alert('Password obbligatoria per annullare l’ODL.');
      return;
    }

    this.orderCancellationInProgress = true;
    this.authService
      .loginCapoturno({ nickname: session.nickname, matricola: trimmedPassword })
      .subscribe({
        next: () => {
          this.workOrderService.cancelWorkOrder(this.selectedOrder!.id).subscribe({
            next: () => {
              this.orderCancellationInProgress = false;
            },
            error: () => {
              this.orderCancellationInProgress = false;
              window.alert('Impossibile annullare l’ODL. Riprova.');
            },
          });
        },
        error: () => {
          this.orderCancellationInProgress = false;
          window.alert('Password errata. Annullamento non eseguito.');
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
