import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dashboard">
      <!-- Work Order Header -->
      <div class="work-order-header">
        <div>
          <h1 class="train-number">Treno ETR700-12</h1>
          <p class="work-order-info">ODL-SPM3N3 · Turno: 6-14 · 15/03/2026, 02:17:56</p>
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
            <span class="stat-value">0</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-badge risolte"></div>
          <div class="stat-content">
            <span class="stat-label">RISOLTE</span>
            <span class="stat-value">0</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-badge parziali"></div>
          <div class="stat-content">
            <span class="stat-label">PARZIALI</span>
            <span class="stat-value">0</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-badge attesa"></div>
          <div class="stat-content">
            <span class="stat-label">IN ATTESA</span>
            <span class="stat-value">0</span>
          </div>
        </div>
      </div>

      <!-- Work Order Code -->
      <div class="work-order-code">
        <span class="code-icon">🔧</span>
        <span class="code-text"><strong>Codice per il tecnico:</strong> ODL-SPM3N3 - il tecnico lo inserisce nella vista Tecnico</span>
      </div>

      <!-- New Task Form -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">+ NUOVA LAVORAZIONE</span>
        </div>
        <form [formGroup]="newTaskForm" (ngSubmit)="onAddTask()" class="task-form">
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
                <option value="">Seleziona priorità</option>
                <option value="preventiva">Preventiva</option>
                <option value="correttiva">Correttiva</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div class="form-group">
              <input
                type="text"
                placeholder="Tecnico assegnato"
                formControlName="technician"
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
          <span class="section-title">LAVORAZIONI (0)</span>
        </div>
        <div class="tasks-empty">
          <p>Nessuna lavorazione aggiunta ancora.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 24px;
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
  `]
})
export class DashboardComponent {
  newTaskForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.newTaskForm = this.fb.group({
      description: ['', Validators.required],
      priority: ['preventiva', Validators.required],
      technician: ['', Validators.required]
    });
  }

  onAddTask() {
    if (this.newTaskForm.valid) {
      console.log('New task:', this.newTaskForm.value);
      this.newTaskForm.reset({ priority: 'preventiva' });
    }
  }
}
