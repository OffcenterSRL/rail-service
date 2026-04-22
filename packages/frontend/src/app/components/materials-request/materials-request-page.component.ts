import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  MaterialRequestExportService,
  MaterialRequestLineFields,
  MaterialRequestSharedFields,
} from '../../services/material-request-export.service';
import { Task, WorkOrder, WorkOrderService } from '../../services/work-order.service';

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

interface SavedMaterialRequestLine {
  descrizione: string;
  codice: string;
  avviso: string;
  tipoIntervento: string;
  guasto: string;
  quantity: string;
  um: string;
}

interface SavedMaterialRequest {
  id: string;
  date: string;
  trainNumber: string;
  codiceODL: string;
  taskDescription: string;
  materialsCount: number;
  cassa: string;
  note: string;
  lines?: SavedMaterialRequestLine[];
}

type WizardStep = 'train' | 'select' | 'details';

// ── Email configuration ────────────────────────────────────────────────────
const MAIL_TO = 'hubfirenze@magazzinohr.it'; // Magazzino HRI - Hub Firenze
const MAIL_CC: string[] = [
  'hmu.service@ricolfi.com',
  'Angelo.Perone@hitachirail.com',
  'Maria.Trombetta@hitachirail.com',
  'ilaria.fontana@hitachirail.com',
  'Antonino.Corsaro@hitachirail.com',
  'Vincenzo.Cozzi@hitachirail.com',
  'michele.deblasi@hitachirail.com',
  'Gennaro.Gatto@hitachirail.com',
  'aldo.napolitano@hitachirail.com',
  'Gennaro.Palmieri@hitachirail.com',
  'Antonio.Zottola@hitachirail.com',
  'Domenico.Nanci@hitachirail.com',
  'leonardo.miraka@hitachirail.com',
];
// ──────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-materials-request-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mat-page">
      <div class="mat-page-header">
        <h2 class="mat-page-title">Richieste Materiali</h2>
        <span class="mat-page-count" *ngIf="savedRequests.length">{{ savedRequests.length }} richieste</span>
      </div>

      <div *ngIf="!savedRequests.length" class="mat-empty">
        <div class="mat-empty-icon">📦</div>
        <p class="mat-empty-title">Nessuna richiesta</p>
        <p class="mat-empty-subtitle">Premi + per creare una nuova richiesta materiali</p>
      </div>

      <div *ngIf="savedRequests.length" class="mat-list">
        <div class="mat-list-header">
          <span>Data</span>
          <span>Treno</span>
          <span>Lavorazione</span>
          <span>N° mat.</span>
          <span>Cassa</span>
          <span>Note</span>
        </div>
        <div *ngFor="let req of savedRequests" class="mat-list-row mat-list-row-clickable" (click)="openRequestDetail(req)">
          <span class="mat-cell">{{ req.date | date:'dd/MM/yyyy HH:mm' }}</span>
          <span class="mat-cell mat-cell-train">{{ req.trainNumber }}</span>
          <span class="mat-cell mat-cell-task">{{ req.taskDescription }}</span>
          <span class="mat-cell mat-cell-center">{{ req.materialsCount }}</span>
          <span class="mat-cell">{{ req.cassa }}</span>
          <span class="mat-cell mat-cell-note">{{ req.note || '—' }}</span>
        </div>
      </div>

      <button class="mat-fab" (click)="openModal()" title="Nuova richiesta">+</button>

      <!-- Detail view modal -->
      <div *ngIf="selectedRequest" class="mat-backdrop" (click)="closeRequestDetail()">
        <div class="mat-modal" (click)="$event.stopPropagation()">
          <div class="mat-modal-header">
            <div>
              <span class="mat-modal-label">Dettaglio richiesta</span>
              <p class="mat-modal-subtitle">{{ selectedRequest.date | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
            <div class="mat-modal-actions">
              <button class="btn btn-secondary btn-close" (click)="closeRequestDetail()">Chiudi</button>
            </div>
          </div>

          <div class="det-meta-row">
            <div class="det-meta-card">
              <span class="det-meta-label">Treno</span>
              <span class="det-meta-value">{{ selectedRequest.trainNumber }}</span>
            </div>
            <div class="det-meta-card">
              <span class="det-meta-label">ODL</span>
              <span class="det-meta-value">{{ selectedRequest.codiceODL || '—' }}</span>
            </div>
            <div class="det-meta-card det-meta-wide">
              <span class="det-meta-label">Lavorazione</span>
              <span class="det-meta-value">{{ selectedRequest.taskDescription }}</span>
            </div>
            <div class="det-meta-card">
              <span class="det-meta-label">Cassa</span>
              <span class="det-meta-value">{{ selectedRequest.cassa }}</span>
            </div>
            <div class="det-meta-card det-meta-wide" *ngIf="selectedRequest.note">
              <span class="det-meta-label">Note</span>
              <span class="det-meta-value">{{ selectedRequest.note }}</span>
            </div>
          </div>

          <div *ngIf="!selectedRequest.lines?.length" class="det-no-lines">
            Dettaglio materiali non disponibile per richieste precedenti.
          </div>

          <ng-container *ngIf="selectedRequest.lines?.length">
            <div class="det-lines-header">
              <span>Materiale</span>
              <span>Codice</span>
              <span>Avviso</span>
              <span>Tipo intervento</span>
              <span>Guasto / Descrizione</span>
              <span>Q.tà</span>
              <span>UM</span>
            </div>
            <div class="det-lines">
              <div *ngFor="let line of selectedRequest.lines" class="det-line">
                <span class="det-cell det-cell-desc">{{ line.descrizione }}</span>
                <span class="det-cell det-cell-code">{{ line.codice || '—' }}</span>
                <span class="det-cell">{{ line.avviso || '—' }}</span>
                <span class="det-cell det-cell-tipo">{{ line.tipoIntervento || '—' }}</span>
                <span class="det-cell">{{ line.guasto || '—' }}</span>
                <span class="det-cell det-cell-center">{{ line.quantity || '—' }}</span>
                <span class="det-cell det-cell-center">{{ line.um || '—' }}</span>
              </div>
            </div>
          </ng-container>
        </div>
      </div>

      <div *ngIf="isModalOpen" class="mat-backdrop" (click)="onBackdropClick()">
        <div class="mat-modal" (click)="$event.stopPropagation()">
          <div class="mat-modal-header">
            <div>
              <span class="mat-modal-label">Richiesta materiali</span>
              <p class="mat-modal-subtitle">{{ getStepSubtitle() }}</p>
            </div>
            <div class="mat-modal-actions">
              <div *ngIf="exportError" class="mat-error">{{ exportError }}</div>
              <button class="btn btn-secondary btn-close" (click)="closeModal()" [disabled]="exportInProgress">Chiudi</button>
            </div>
          </div>

          <!-- Step: train -->
          <ng-container *ngIf="wizardStep === 'train'">
            <div class="mat-form">
              <label class="mat-field">
                <span class="mat-field-label">Seleziona treno</span>
                <select class="mat-input" [(ngModel)]="selectedTrainNumber" [ngModelOptions]="{ standalone: true }">
                  <option value="" disabled>Seleziona treno attivo</option>
                  <option *ngFor="let train of activeTrains" [value]="train">{{ train }}</option>
                </select>
              </label>
              <div *ngIf="activeTrains.length === 0" class="mat-helper">Nessun treno con ordini attivi al momento.</div>
              <div class="mat-step-actions">
                <span class="mat-helper">Seleziona il treno su cui vuoi effettuare la richiesta.</span>
                <button class="btn btn-add" (click)="proceedToSelect()" [disabled]="!selectedTrainNumber">Avanti</button>
              </div>
            </div>
          </ng-container>

          <!-- Step: select task + materials -->
          <ng-container *ngIf="wizardStep === 'select'">
            <div class="mat-form">
              <label class="mat-field">
                <span class="mat-field-label">Lavorazione</span>
                <select class="mat-input" [(ngModel)]="selectedTaskId" [ngModelOptions]="{ standalone: true }">
                  <option value="" disabled>Seleziona lavorazione</option>
                  <option *ngFor="let entry of selectedTrainTasks" [value]="entry.task.id">
                    [{{ entry.order.codiceODL }}] {{ entry.task.description }}
                  </option>
                </select>
              </label>
              <label class="mat-field mat-search">
                <span class="mat-field-label">Cerca materiale</span>
                <input
                  type="text"
                  class="mat-input"
                  placeholder="Descrizione o codice articolo"
                  [(ngModel)]="materialsSearchQuery"
                  [ngModelOptions]="{ standalone: true }"
                  (input)="onSearchChange()"
                />
              </label>
              <div class="mat-results">
                <div *ngIf="materialsLoading" class="mat-helper">Caricamento elenco...</div>
                <div *ngIf="materialsLoadError" class="mat-helper mat-error-text">{{ materialsLoadError }}</div>
                <ng-container *ngIf="!materialsLoading && !materialsLoadError">
                  <div *ngIf="selectedMaterials.length" class="mat-selected-block">
                    <div class="mat-selected-title">Selezionati ({{ selectedMaterials.length }})</div>
                    <div class="mat-selected-list">
                      <div *ngFor="let item of selectedMaterials" class="mat-selected-row">
                        <div class="mat-cell">{{ item.descrizione }}</div>
                        <div class="mat-cell mat-code">{{ item.numero_documento || '—' }}</div>
                        <div class="mat-cell mat-meta">{{ item.numero_pezzi || '—' }}</div>
                        <div class="mat-cell">
                          <a *ngIf="item.source_pdf" [attr.href]="getMaterialFileUrl(item)" target="_blank" rel="noopener" class="mat-link">Apri</a>
                          <span *ngIf="!item.source_pdf">—</span>
                        </div>
                        <button class="btn btn-secondary btn-sm" type="button" (click)="removeSelectedMaterial(item)">Rimuovi</button>
                      </div>
                    </div>
                  </div>
                  <div class="mat-results-header">
                    <span>Descrizione</span>
                    <span>Numero</span>
                    <span>Pezzi</span>
                    <span>File</span>
                  </div>
                  <div
                    *ngFor="let item of materialsResults"
                    class="mat-result-row"
                    [class.selected]="isMaterialSelected(item)"
                    (click)="toggleMaterial(item)"
                  >
                    <div class="mat-cell">{{ item.descrizione }}</div>
                    <div class="mat-cell mat-code">{{ item.numero_documento || '—' }}</div>
                    <div class="mat-cell mat-meta">{{ item.numero_pezzi || '—' }}</div>
                    <div class="mat-cell">
                      <a *ngIf="item.source_pdf" [attr.href]="getMaterialFileUrl(item)" target="_blank" rel="noopener" (click)="$event.stopPropagation()" class="mat-link">Apri</a>
                      <span *ngIf="!item.source_pdf">—</span>
                    </div>
                  </div>
                </ng-container>
              </div>
              <div class="mat-step-actions">
                <button class="btn btn-secondary" (click)="backToTrain()">Indietro</button>
                <span class="mat-helper">Seleziona una lavorazione e almeno un materiale per continuare.</span>
                <button class="btn btn-add" (click)="proceedToDetails()" [disabled]="!canProceedToDetails()">Avanti</button>
              </div>
            </div>
          </ng-container>

          <!-- Step: details + export -->
          <ng-container *ngIf="wizardStep === 'details'">
            <div class="mat-form">
              <div class="mat-summary">
                <div class="mat-summary-card">
                  <span class="mat-summary-label">Lavorazione</span>
                  <strong>{{ getSelectedTaskDescription() }}</strong>
                </div>
                <div class="mat-summary-card">
                  <span class="mat-summary-label">Materiali</span>
                  <strong>{{ selectedMaterials.length }}</strong>
                </div>
                <div class="mat-summary-card">
                  <span class="mat-summary-label">Treno</span>
                  <strong>{{ selectedTrainNumber }}</strong>
                </div>
              </div>

              <div class="mat-shared-row">
                <label class="mat-field">
                  <span class="mat-field-label">Cassa</span>
                  <input type="text" class="mat-input" [(ngModel)]="sharedDraft.cassa" [ngModelOptions]="{ standalone: true }" />
                </label>
                <label class="mat-field">
                  <span class="mat-field-label">Note</span>
                  <input type="text" class="mat-input" placeholder="Opzionale" [(ngModel)]="sharedDraft.note" [ngModelOptions]="{ standalone: true }" />
                </label>
              </div>

              <div class="mat-lines">
                <div *ngFor="let line of lineDrafts" class="mat-line">
                  <div class="mat-line-info">
                    <div class="mat-line-desc">{{ line.item.descrizione }}</div>
                    <div class="mat-line-detail">
                      {{ line.item.numero_documento || line.item.codice_ditta_documento || line.item.codice_fs || '—' }}
                      · Tav. {{ line.item.tavola || '—' }} · Rif. {{ line.item.riferimento || '—' }}
                    </div>
                  </div>
                  <div class="mat-line-fields">
                    <label class="mat-field mat-inline-field">
                      <span class="mat-field-label">Avviso</span>
                      <input type="text" class="mat-input" [(ngModel)]="line.avviso" [ngModelOptions]="{ standalone: true }" />
                    </label>
                    <label class="mat-field mat-inline-field">
                      <span class="mat-field-label">Tipo intervento</span>
                      <select class="mat-input" [(ngModel)]="line.tipoIntervento" [ngModelOptions]="{ standalone: true }">
                        <option value="" disabled>Seleziona tipo</option>
                        <option *ngFor="let opt of typeOptions" [value]="opt">{{ opt }}</option>
                      </select>
                    </label>
                    <label class="mat-field mat-inline-field">
                      <span class="mat-field-label">Guasto</span>
                      <input type="text" class="mat-input" [(ngModel)]="line.guasto" [ngModelOptions]="{ standalone: true }" />
                    </label>
                    <label class="mat-field mat-inline-field">
                      <span class="mat-field-label">Q.tà</span>
                      <input type="text" class="mat-input" [(ngModel)]="line.quantity" [ngModelOptions]="{ standalone: true }" />
                    </label>
                    <label class="mat-field mat-inline-field">
                      <span class="mat-field-label">UM</span>
                      <select class="mat-input" [(ngModel)]="line.um" [ngModelOptions]="{ standalone: true }">
                        <option value="" disabled>UM</option>
                        <option *ngFor="let opt of umOptions" [value]="opt">{{ opt }}</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>

              <div class="mat-step-actions">
                <button class="btn btn-secondary" (click)="backToSelect()" [disabled]="exportInProgress">Indietro</button>
                <button class="btn btn-add" (click)="exportRequest()" [disabled]="!canExport() || exportInProgress">
                  {{ exportInProgress ? 'Generazione in corso...' : 'Genera file Excel' }}
                </button>
              </div>
            </div>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .mat-page {
        display: flex;
        flex-direction: column;
        flex: 1;
        background: rgba(9, 13, 26, 0.92);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 24px;
        gap: 20px;
        position: relative;
        overflow-y: auto;
        box-shadow: var(--glass-shadow);
      }

      .mat-page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-shrink: 0;
      }

      .mat-page-title {
        font-size: 18px;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
      }

      .mat-page-count {
        font-size: 12px;
        color: var(--text-secondary);
        background: rgba(255, 255, 255, 0.06);
        padding: 4px 10px;
        border-radius: 999px;
      }

      .mat-empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        text-align: center;
        padding: 40px;
      }

      .mat-empty-icon {
        font-size: 52px;
        opacity: 0.3;
        line-height: 1;
      }

      .mat-empty-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
      }

      .mat-empty-subtitle {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 0;
      }

      /* List */
      .mat-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .mat-list-header {
        display: grid;
        grid-template-columns: 145px 90px 1fr 65px 110px 1fr;
        gap: 10px;
        padding: 6px 12px;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: var(--text-secondary);
      }

      .mat-list-row {
        display: grid;
        grid-template-columns: 145px 90px 1fr 65px 110px 1fr;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.06);
        background: rgba(255, 255, 255, 0.02);
        font-size: 13px;
        align-items: center;
        transition: background 0.15s ease;
      }

      .mat-list-row:hover {
        background: rgba(255, 255, 255, 0.04);
      }

      .mat-list-row-clickable {
        cursor: pointer;
      }

      .mat-list-row-clickable:hover {
        background: rgba(123, 199, 255, 0.06);
        border-color: rgba(123, 199, 255, 0.2);
      }

      .mat-cell {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .mat-cell-train {
        font-weight: 600;
        color: #7bc7ff;
      }

      .mat-cell-task {
        color: var(--text-primary);
      }

      .mat-cell-center {
        text-align: center;
      }

      .mat-cell-note {
        color: var(--text-secondary);
      }

      /* FAB */
      .mat-fab {
        position: sticky;
        bottom: 0;
        align-self: flex-end;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: linear-gradient(180deg, #ff8e3a, #ff5d1e);
        color: #0c0602;
        font-size: 28px;
        font-weight: 400;
        border: none;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(255, 93, 30, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        flex-shrink: 0;
        margin-top: auto;
      }

      .mat-fab:hover {
        transform: scale(1.08);
        box-shadow: 0 12px 30px rgba(255, 93, 30, 0.55);
      }

      /* Modal */
      .mat-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(8, 12, 24, 0.75);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        z-index: 40;
      }

      .mat-modal {
        width: min(1800px, 98vw);
        max-height: 94vh;
        overflow-y: auto;
        background: linear-gradient(180deg, rgba(14, 19, 36, 0.95), rgba(22, 30, 50, 0.98));
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 18px;
        box-shadow: 0 30px 70px rgba(3, 8, 18, 0.8);
        padding: 22px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .mat-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }

      .mat-modal-label {
        font-size: 12px;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: var(--text-secondary);
      }

      .mat-modal-subtitle {
        font-size: 13px;
        color: var(--text-muted);
        margin: 4px 0 0;
      }

      .mat-modal-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .mat-error {
        font-size: 12px;
        color: #ff6b6b;
        max-width: 280px;
        text-align: right;
      }

      .mat-error-text {
        color: #ff6b6b;
      }

      /* Form */
      .mat-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .mat-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .mat-field-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: var(--text-secondary);
      }

      .mat-input {
        border-radius: 14px;
        background: rgba(17, 22, 35, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 12px;
        color: var(--text-primary);
        font-size: 13px;
      }

      .mat-helper {
        font-size: 12px;
        color: var(--text-muted);
      }

      .mat-step-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 4px;
      }

      .mat-search {
        margin-top: 4px;
      }

      /* Results */
      .mat-results {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 300px;
        overflow-y: auto;
        padding-right: 2px;
      }

      .mat-selected-block {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 10px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }

      .mat-selected-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: var(--text-secondary);
      }

      .mat-selected-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .mat-selected-row {
        display: grid;
        grid-template-columns: 1fr 180px 80px 60px auto;
        gap: 8px;
        align-items: center;
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.06);
        font-size: 12px;
      }

      .mat-results-header {
        display: grid;
        grid-template-columns: 1fr 180px 80px 60px;
        gap: 8px;
        padding: 4px 10px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: var(--text-secondary);
      }

      .mat-result-row {
        display: grid;
        grid-template-columns: 1fr 180px 80px 60px;
        gap: 8px;
        align-items: center;
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.06);
        background: rgba(255, 255, 255, 0.02);
        font-size: 12px;
        cursor: pointer;
        transition: border-color 0.15s ease, background 0.15s ease;
      }

      .mat-result-row:hover {
        border-color: rgba(255, 255, 255, 0.16);
      }

      .mat-result-row.selected {
        border-color: rgba(251, 146, 60, 0.6);
        background: rgba(251, 146, 60, 0.12);
      }

      .mat-code {
        color: var(--text-secondary);
        font-weight: 600;
      }

      .mat-meta {
        color: var(--text-secondary);
      }

      .mat-link {
        color: #7ab7ff;
        text-decoration: underline;
        font-size: 12px;
      }

      /* Summary */
      .mat-summary {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }

      .mat-summary-card {
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.03);
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .mat-summary-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: var(--text-secondary);
      }

      .mat-shared-row {
        display: grid;
        grid-template-columns: 240px minmax(0, 1fr);
        gap: 12px;
      }

      /* Lines */
      .mat-lines {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .mat-line {
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.03);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .mat-line-info {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .mat-line-desc {
        font-size: 13px;
        color: var(--text-primary);
      }

      .mat-line-detail {
        font-size: 11px;
        color: var(--text-secondary);
      }

      .mat-line-fields {
        display: grid;
        grid-template-columns: 140px minmax(160px, 1fr) minmax(140px, 1fr) 110px 120px;
        gap: 10px;
        align-items: end;
      }

      .mat-inline-field {
        margin: 0;
      }

      /* Buttons */
      .btn {
        padding: 10px 16px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 600;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        border: 1px solid transparent;
        cursor: pointer;
      }

      .btn-secondary {
        background: rgba(255, 255, 255, 0.06);
        color: var(--text-secondary);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .btn-secondary:hover:not([disabled]) {
        transform: translateY(-1px);
      }

      .btn-add {
        background: linear-gradient(180deg, #ff8e3a, #ff5d1e);
        color: #0c0602;
        border: none;
      }

      .btn-add:hover:not([disabled]) {
        transform: translateY(-1px);
        box-shadow: 0 8px 20px rgba(255, 93, 30, 0.35);
      }

      .btn-add[disabled],
      .btn-secondary[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-close {
        padding: 8px 12px;
        font-size: 12px;
      }

      .btn-sm {
        height: 28px;
        padding: 0 10px;
        font-size: 11px;
      }

      /* ── Detail modal ── */
      .det-meta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .det-meta-card {
        flex: 1 1 140px;
        padding: 10px 14px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.03);
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .det-meta-wide {
        flex: 2 1 280px;
      }

      .det-meta-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: var(--text-secondary);
      }

      .det-meta-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
      }

      .det-no-lines {
        font-size: 13px;
        color: var(--text-secondary);
        padding: 12px;
        text-align: center;
        border: 1px dashed rgba(255, 255, 255, 0.12);
        border-radius: 10px;
      }

      .det-lines-header {
        display: grid;
        grid-template-columns: 2fr 1.2fr 1fr 1.2fr 2fr 70px 70px;
        gap: 10px;
        padding: 6px 12px;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.7px;
        color: var(--text-secondary);
      }

      .det-lines {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-height: 340px;
        overflow-y: auto;
      }

      .det-line {
        display: grid;
        grid-template-columns: 2fr 1.2fr 1fr 1.2fr 2fr 70px 70px;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.06);
        background: rgba(255, 255, 255, 0.02);
        align-items: center;
      }

      .det-cell {
        font-size: 13px;
        color: var(--text-primary);
        overflow-wrap: break-word;
        word-break: break-word;
        min-width: 0;
      }

      .det-cell-desc {
        font-weight: 500;
      }

      .det-cell-code {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
        font-family: monospace;
      }

      .det-cell-tipo {
        color: #7bc7ff;
        font-size: 12px;
      }

      .det-cell-center {
        text-align: center;
        color: var(--text-secondary);
      }

      @media (max-width: 900px) {
        .mat-list-header,
        .mat-list-row {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 768px) {
        .mat-summary {
          grid-template-columns: 1fr;
        }

        .mat-shared-row {
          grid-template-columns: 1fr;
        }

        .mat-line-fields {
          grid-template-columns: 1fr 1fr;
        }

        .mat-results-header,
        .mat-result-row,
        .mat-selected-row {
          grid-template-columns: 1fr;
          gap: 4px;
        }

        .mat-list-header,
        .mat-list-row {
          grid-template-columns: 1fr;
        }

        .det-lines-header {
          display: none;
        }

        .det-line {
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        .det-cell-desc {
          grid-column: 1 / -1;
        }
      }
    `,
  ],
})
export class MaterialsRequestPageComponent implements OnInit, OnDestroy {
  allWorkOrders: WorkOrder[] = [];

  isModalOpen = false;
  wizardStep: WizardStep = 'train';

  selectedTrainNumber = '';
  selectedTaskId = '';
  materialsSearchQuery = '';
  materialsResults: MaterialItem[] = [];
  materialsLoading = false;
  materialsLoadError = '';
  selectedMaterials: MaterialItem[] = [];

  sharedDraft: MaterialRequestSharedFields = { cassa: '', note: '' };
  lineDrafts: MaterialRequestLineDraft[] = [];

  exportInProgress = false;
  exportError = '';

  savedRequests: SavedMaterialRequest[] = [];
  selectedRequest: SavedMaterialRequest | null = null;

  readonly typeOptions = ['Garanzia', 'Extra Garanzia'];
  readonly umOptions = ['n°', 'kg', 'lt', 'mt', 'kit'];

  private materialsCatalog: MaterialItem[] = [];
  private workOrdersSub?: Subscription;
  private readonly storageKey = 'rail-service.material-requests';

  constructor(
    private workOrderService: WorkOrderService,
    private materialRequestExportService: MaterialRequestExportService,
  ) {}

  ngOnInit(): void {
    this.workOrdersSub = this.workOrderService.getWorkOrders().subscribe((orders) => {
      this.allWorkOrders = orders;
    });
    this.loadSavedRequests();
  }

  get activeTrains(): string[] {
    const seen = new Set<string>();
    const trains: string[] = [];
    for (const order of this.allWorkOrders) {
      if (
        (order.status === 'pending' || order.status === 'active') &&
        !seen.has(order.trainNumber)
      ) {
        seen.add(order.trainNumber);
        trains.push(order.trainNumber);
      }
    }
    return trains.sort();
  }

  get selectedTrainTasks(): { task: Task; order: WorkOrder }[] {
    if (!this.selectedTrainNumber) return [];
    const result: { task: Task; order: WorkOrder }[] = [];
    for (const order of this.allWorkOrders) {
      if (
        order.trainNumber === this.selectedTrainNumber &&
        (order.status === 'pending' || order.status === 'active')
      ) {
        for (const task of order.tasks) {
          result.push({ task, order });
        }
      }
    }
    return result;
  }

  openModal(): void {
    this.isModalOpen = true;
    this.resetWizard();
    if (!this.materialsCatalog.length) {
      this.loadMaterialsCatalog();
    }
  }

  closeModal(): void {
    if (this.exportInProgress) return;
    this.isModalOpen = false;
  }

  onBackdropClick(): void {
    this.closeModal();
  }

  openRequestDetail(req: SavedMaterialRequest): void {
    this.selectedRequest = req;
  }

  closeRequestDetail(): void {
    this.selectedRequest = null;
  }

  private resetWizard(): void {
    this.wizardStep = 'train';
    this.selectedTrainNumber = '';
    this.selectedTaskId = '';
    this.materialsSearchQuery = '';
    this.materialsResults = [];
    this.selectedMaterials = [];
    this.sharedDraft = { cassa: '', note: '' };
    this.lineDrafts = [];
    this.exportInProgress = false;
    this.exportError = '';
  }

  proceedToSelect(): void {
    if (!this.selectedTrainNumber) return;
    this.wizardStep = 'select';
    this.updateMaterialsResults();
  }

  backToTrain(): void {
    this.wizardStep = 'train';
  }

  proceedToDetails(): void {
    if (!this.canProceedToDetails()) return;
    this.exportError = '';
    this.wizardStep = 'details';
    this.syncLineDrafts();
  }

  backToSelect(): void {
    this.exportError = '';
    this.wizardStep = 'select';
  }

  canProceedToDetails(): boolean {
    return Boolean(this.selectedTaskId && this.selectedMaterials.length);
  }

  canExport(): boolean {
    const sharedValid = Boolean(this.sharedDraft.cassa?.trim());
    const linesValid =
      this.lineDrafts.length > 0 &&
      this.lineDrafts.every(
        (line) =>
          Boolean(line.avviso?.trim()) &&
          Boolean(line.guasto?.trim()) &&
          Boolean(line.quantity?.trim()) &&
          Boolean(line.tipoIntervento?.trim()) &&
          Boolean(line.um?.trim()),
      );
    return sharedValid && linesValid;
  }

  async exportRequest(): Promise<void> {
    if (!this.canExport() || this.exportInProgress) return;

    const taskEntry = this.selectedTrainTasks.find((t) => t.task.id === this.selectedTaskId);
    if (!taskEntry) {
      this.exportError = 'Lavorazione non trovata. Riprova.';
      return;
    }

    const lines = this.lineDrafts.reduce<Record<string, MaterialRequestLineFields>>(
      (acc, line) => {
        acc[line.key] = {
          avviso: line.avviso.trim(),
          guasto: line.guasto.trim(),
          tipoIntervento: line.tipoIntervento.trim(),
          quantity: line.quantity.trim(),
          um: line.um.trim(),
        };
        return acc;
      },
      {},
    );

    this.exportInProgress = true;
    this.exportError = '';

    try {
      await this.materialRequestExportService.exportRequest({
        order: taskEntry.order,
        materials: this.selectedMaterials,
        shared: {
          cassa: this.sharedDraft.cassa.trim(),
          note: this.sharedDraft.note.trim(),
        },
        lines,
      });

      this.persistRequest({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        trainNumber: this.selectedTrainNumber,
        codiceODL: taskEntry.order.codiceODL,
        taskDescription: taskEntry.task.description,
        materialsCount: this.selectedMaterials.length,
        cassa: this.sharedDraft.cassa.trim(),
        note: this.sharedDraft.note.trim(),
        lines: this.lineDrafts.map((l) => ({
          descrizione: l.item.descrizione,
          codice: l.item.numero_documento || l.item.codice_ditta_documento || l.item.codice_fs || '',
          avviso: l.avviso.trim(),
          tipoIntervento: l.tipoIntervento.trim(),
          guasto: l.guasto.trim(),
          quantity: l.quantity.trim(),
          um: l.um.trim(),
        })),
      });

      this.openMailClient(this.selectedTrainNumber);
      this.isModalOpen = false;
      this.resetWizard();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.exportError = `Errore: ${detail}`;
    } finally {
      this.exportInProgress = false;
    }
  }

  getSelectedTaskDescription(): string {
    return (
      this.selectedTrainTasks.find((t) => t.task.id === this.selectedTaskId)?.task.description ||
      '—'
    );
  }

  getStepSubtitle(): string {
    if (this.wizardStep === 'train') return 'Seleziona il treno su cui effettuare la richiesta.';
    if (this.wizardStep === 'select') return 'Seleziona la lavorazione e i materiali necessari.';
    return 'Compila i campi obbligatori e genera il file Excel.';
  }

  private loadMaterialsCatalog(): void {
    this.materialsLoading = true;
    this.materialsLoadError = '';
    fetch('/assets/materials/materials.json')
      .then((res) => {
        if (!res.ok) throw new Error('Impossibile caricare il catalogo');
        return res.json();
      })
      .then((data: MaterialItem[]) => {
        this.materialsCatalog = Array.isArray(data) ? data : [];
        this.updateMaterialsResults();
      })
      .catch(() => {
        this.materialsLoadError = 'Errore nel caricamento del catalogo materiali.';
      })
      .finally(() => {
        this.materialsLoading = false;
      });
  }

  onSearchChange(): void {
    this.updateMaterialsResults();
  }

  private updateMaterialsResults(): void {
    const query = this.materialsSearchQuery.trim().toLowerCase();
    let results = this.materialsCatalog;
    if (query.length >= 2) {
      results = results.filter((item) => this.matchesMaterialQuery(item, query));
    }
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
    return fields.some((v) => v && v.toLowerCase().includes(query));
  }

  toggleMaterial(item: MaterialItem): void {
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
    this.selectedMaterials = this.selectedMaterials.filter((m) => this.getMaterialKey(m) !== key);
    this.lineDrafts = this.lineDrafts.filter((l) => l.key !== key);
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
      .filter((v) => v && v.trim())
      .join('|');
  }

  getMaterialFileUrl(item: MaterialItem): string {
    if (!item.source_pdf) return '';
    const encoded = encodeURIComponent(item.source_pdf);
    const page = item.source_page?.trim();
    return `/assets/materials-pdf/${encoded}${page ? '#page=' + encodeURIComponent(page) : ''}`;
  }

  private syncLineDrafts(): void {
    const existing = new Map(this.lineDrafts.map((l) => [l.key, l]));
    this.lineDrafts = this.selectedMaterials.map((item) => {
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

  private loadSavedRequests(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      this.savedRequests = stored ? (JSON.parse(stored) as SavedMaterialRequest[]) : [];
    } catch {
      this.savedRequests = [];
    }
  }

  private persistRequest(req: SavedMaterialRequest): void {
    this.savedRequests = [req, ...this.savedRequests];
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.savedRequests));
    } catch {
      // ignore storage errors
    }
  }

  private openMailClient(trainNumber: string): void {
    const subject = encodeURIComponent(`Richiesta materiale ${trainNumber}`);
    const body = encodeURIComponent(
      'Buongiorno\n\nCon la presente sono a richiedere il materiale in allegato\n\nSaluti',
    );
    const cc = encodeURIComponent(MAIL_CC.join(';'));
    const mailto = `mailto:${MAIL_TO}?cc=${cc}&subject=${subject}&body=${body}`;
    window.location.href = mailto;
  }

  ngOnDestroy(): void {
    this.workOrdersSub?.unsubscribe();
  }
}
