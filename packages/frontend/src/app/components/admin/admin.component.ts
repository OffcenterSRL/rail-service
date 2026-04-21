import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AdminConfigService, CapoturnoConfig } from '../../services/admin-config.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="admin-page">
      <header class="admin-header">
        <div>
          <p class="admin-label">Pannello amministratore</p>
          <h1>Gestione capoturni</h1>
          <p class="admin-subtitle">
            Proteggi e aggiorna la lista di capoturni attivi via password.
          </p>
        </div>
        <div class="admin-status" [class.unlocked]="configUnlocked">
          <span class="status-dot" [class.active]="configUnlocked"></span>
          {{ configUnlocked ? 'Elenco sbloccato' : 'Accesso protetto' }}
        </div>
      </header>

      <form [formGroup]="adminForm" class="admin-form">
        <div class="password-row">
          <input
            type="password"
            formControlName="password"
            placeholder="Password amministratore"
            class="task-input"
          />
          <button type="button" class="btn btn-secondary" (click)="unlockConfig()" [disabled]="configLoading">
            {{ configUnlocked ? 'Aggiorna elenco' : 'Sblocca' }}
          </button>
          <button
            type="button"
            class="btn btn-tertiary"
            (click)="clearStoredPassword()"
            [disabled]="!storedPassword"
          >
            Cancella password memorizzata
          </button>
        </div>

        <p *ngIf="configError" class="config-feedback error">{{ configError }}</p>
        <p *ngIf="configSuccess" class="config-feedback success">{{ configSuccess }}</p>

        <section *ngIf="configUnlocked" class="technicians-section">
          <h3 class="section-title">Capoturni</h3>
          <div formArrayName="capoturni" class="technicians-grid">
            <div
              *ngFor="let capoCtrl of capoturniArray.controls; let i = index"
              [formGroupName]="i"
              class="technician-card"
            >
              <div class="technician-card-fields">
                <input formControlName="name" placeholder="Nome capoturno" class="task-input" />
                <input formControlName="nickname" placeholder="Nickname" class="task-input" />
                <input formControlName="matricola" placeholder="Matricola" class="task-input" />
              </div>
              <div class="technician-card-actions">
                <button
                  type="button"
                  class="btn btn-tertiary"
                  (click)="removeCapoturno(i)"
                  [disabled]="isCapoturnoRowDeleting(i)"
                >
                  {{ isCapoturnoRowDeleting(i) ? 'Rimuovendo...' : 'Rimuovi' }}
                </button>
                <button
                  type="button"
                  class="btn btn-add"
                  (click)="saveCapoturnoRow(i)"
                  [disabled]="isCapoturnoRowSaving(i) || capoCtrl.invalid"
                >
                  {{ isCapoturnoRowSaving(i) ? 'Salvataggio...' : 'Salva' }}
                </button>
              </div>
            </div>
            <div *ngIf="capoturniArray.length === 0" class="technicians-empty">
              <p>Nessun capoturno configurato. Aggiungine uno per iniziare.</p>
            </div>
          </div>
          <div class="config-form-actions">
            <button type="button" class="btn btn-ghost" (click)="addCapoturnoRow()">Aggiungi capoturno</button>
          </div>
        </section>
      </form>
    </div>
  `,
  styles: [
    `
      .admin-page {
        display: flex;
        flex-direction: column;
        gap: 24px;
        padding: 20px;
        min-height: 100%;
      }

      .admin-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        padding: 20px 24px;
        border-radius: 22px;
        background: linear-gradient(180deg, rgba(7, 10, 25, 0.95), rgba(20, 26, 46, 0.9));
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: var(--glass-shadow);
      }

      .admin-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin: 0;
        color: var(--text-secondary);
      }

      .admin-subtitle {
        margin: 4px 0 0;
        color: var(--text-muted);
        font-size: 13px;
      }

      .admin-status {
        display: flex;
        align-items: center;
        gap: 10px;
        letter-spacing: 1px;
        font-size: 12px;
        text-transform: uppercase;
        color: var(--text-secondary);
      }

      .admin-status.unlocked {
        color: #7bc7ff;
      }

      .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--accent-lime);
      }

      .status-dot.active {
        background: #7bc7ff;
      }

      .admin-form {
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(15, 20, 34, 0.9);
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .password-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .config-feedback {
        font-size: 12px;
        border-radius: 10px;
        padding: 8px 12px;
      }

      .config-feedback.error {
        background: rgba(255, 77, 79, 0.12);
        color: var(--error);
      }

      .config-feedback.success {
        background: rgba(76, 175, 80, 0.12);
        color: var(--accent-lime);
      }

      .technicians-section {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .section-title {
        margin: 0;
        font-size: 16px;
        color: var(--text-primary);
      }

      .technicians-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 16px;
      }

      .technician-card {
        border-radius: 18px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 16px;
        background: rgba(18, 22, 42, 0.85);
        box-shadow: 0 16px 30px rgba(1, 6, 16, 0.6);
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .technician-card-fields {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 10px;
      }

      .technician-card-actions {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }

      .technician-card .task-input {
        min-width: 0;
      }

      .technicians-empty {
        grid-column: 1 / -1;
        padding: 24px;
        border-radius: 16px;
        border: 1px dashed rgba(255, 255, 255, 0.4);
        text-align: center;
        color: var(--text-secondary);
        background: rgba(255, 255, 255, 0.02);
      }

      .config-form-actions {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      .btn {
        font-size: 13px;
        font-weight: 600;
        border-radius: 999px;
        padding: 8px 20px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        border: 1px solid transparent;
        cursor: pointer;
      }

      .btn-secondary,
      .btn-tertiary,
      .btn-ghost {
        background: rgba(255, 255, 255, 0.04);
        color: var(--text-secondary);
        border-color: rgba(255, 255, 255, 0.4);
      }

      .btn-secondary:hover,
      .btn-tertiary:hover,
      .btn-ghost:hover {
        border-color: rgba(124, 199, 255, 0.6);
        transform: translateY(-1px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.35);
      }

      .btn-add {
        background: linear-gradient(180deg, #7bc7ff, #4b6ef5);
        color: #030712;
        border: none;
        box-shadow: 0 12px 30px rgba(75, 110, 245, 0.35);
      }

      .btn-add:disabled {
        opacity: 0.5;
        box-shadow: none;
      }

      .task-input {
        border-radius: 12px;
        background: rgba(17, 22, 35, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: var(--text-primary);
      }

      @media (max-width: 768px) {
        .admin-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 18px;
        }

        .admin-page {
          padding: 14px;
          gap: 16px;
        }
      }

      @media (max-width: 600px) {
        .admin-page {
          padding: 10px;
        }

        .admin-header {
          padding: 14px;
          border-radius: 16px;
        }

        .admin-form {
          padding: 14px;
          border-radius: 16px;
        }

        .password-row {
          flex-direction: column;
        }

        .password-row .btn {
          width: 100%;
        }

        .technicians-grid {
          grid-template-columns: 1fr;
        }

        .config-form-actions {
          flex-direction: column;
          align-items: stretch;
        }

        .config-form-actions .btn {
          width: 100%;
          text-align: center;
        }
      }
    `,
  ],
})
export class AdminComponent implements OnInit {
  adminForm: FormGroup;
  configUnlocked = false;
  configLoading = false;
  configError: string | null = null;
  configSuccess: string | null = null;
  private currentAdminPassword: string | null = null;
  capoturnoRowSaving: Record<number, boolean> = {};
  capoturnoRowDeleting: Record<number, boolean> = {};
  storedPassword: string | null = null;
  private readonly adminPasswordStorageKey = 'rail-service.admin-password';

  constructor(private fb: FormBuilder, private adminConfigService: AdminConfigService) {
    this.adminForm = this.fb.group({
      password: ['', Validators.required],
      capoturni: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.storedPassword = this.readStoredPassword();
    if (this.storedPassword) {
      this.adminForm.get('password')?.setValue(this.storedPassword);
    }
  }

  get capoturniArray(): FormArray {
    return this.adminForm.get('capoturni') as FormArray;
  }

  unlockConfig(): void {
    const password = this.adminForm.get('password')?.value;
    if (!password) {
      this.configError = 'Inserisci la password amministratore.';
      this.configSuccess = null;
      return;
    }

    this.configLoading = true;
    this.adminConfigService.getCapoturni(password).subscribe({
      next: (capoturni) => {
        this.configUnlocked = true;
        this.configError = null;
        this.configSuccess = 'Lista capoturni caricata';
        this.currentAdminPassword = password;
        this.persistStoredPassword(password);
        this.storedPassword = password;
        this.setCapoturni(capoturni);
        this.configLoading = false;
      },
      error: (error) => {
        this.configLoading = false;
        this.configUnlocked = false;
        this.configError = error?.error?.error ?? 'Password errata';
        this.configSuccess = null;
        this.currentAdminPassword = null;
        this.clearCapoturni();
      },
    });
  }

  clearStoredPassword(): void {
    this.removeStoredPassword();
    this.storedPassword = null;
    this.currentAdminPassword = null;
    this.adminForm.get('password')?.reset('');
    this.configSuccess = 'Password rimossa dalla memoria';
    this.configError = null;
    this.configUnlocked = false;
    this.clearCapoturni();
    this.capoturnoRowSaving = {};
    this.capoturnoRowDeleting = {};
  }

  addCapoturnoRow(): void {
    this.capoturniArray.push(this.createCapoturnoGroup());
  }

  removeCapoturno(index: number): void {
    const control = this.capoturniArray.at(index);
    if (!control) {
      return;
    }
    const name = control.get('name')?.value ?? 'questo capoturno';
    const confirmed = window.confirm(`Confermi la rimozione di ${name}?`);
    if (!confirmed) {
      return;
    }
    const capoturnoId = control.get('id')?.value;
    if (!capoturnoId) {
      this.capoturniArray.removeAt(index);
      return;
    }

    const password = this.currentAdminPassword;
    if (!password) {
      this.configError = 'Password amministratore non valida.';
      this.configSuccess = null;
      return;
    }

    this.setCapoturnoRowDeleting(index, true);
    this.adminConfigService.deleteCapoturno(password, capoturnoId).subscribe({
      next: (updated) => {
        this.configSuccess = 'Capoturno rimosso';
        this.configError = null;
        this.setCapoturni(updated);
        this.setCapoturnoRowDeleting(index, false);
      },
      error: (error) => {
        this.configError = error?.error?.error ?? 'Errore durante la rimozione';
        this.configSuccess = null;
        this.setCapoturnoRowDeleting(index, false);
      },
    });
  }

  saveCapoturnoRow(index: number): void {
    const control = this.capoturniArray.at(index);
    if (!control) {
      return;
    }
    const password = this.currentAdminPassword;
    if (!password) {
      this.configError = 'Password amministratore non valida.';
      this.configSuccess = null;
      return;
    }
    if (control.invalid) {
      control.markAllAsTouched();
      return;
    }

    const capoturno = control.value as CapoturnoConfig;
    this.setCapoturnoRowSaving(index, true);
    this.adminConfigService.saveCapoturno(password, capoturno).subscribe({
      next: (saved) => {
        control.patchValue(saved);
        this.configSuccess = `Capoturno ${saved.name} salvato`;
        this.configError = null;
        this.setCapoturnoRowSaving(index, false);
      },
      error: (error) => {
        this.configError = error?.error?.error ?? 'Errore durante il salvataggio';
        this.configSuccess = null;
        this.setCapoturnoRowSaving(index, false);
      },
    });
  }

  private createCapoturnoGroup(capo?: CapoturnoConfig): FormGroup {
    return this.fb.group({
      id: [capo?.id ?? ''],
      name: [capo?.name ?? '', Validators.required],
      nickname: [capo?.nickname ?? '', Validators.required],
      matricola: [capo?.matricola ?? '', Validators.required],
    });
  }

  private setCapoturni(list: CapoturnoConfig[]): void {
    this.clearCapoturni();
    list.forEach((capo) => this.capoturniArray.push(this.createCapoturnoGroup(capo)));
  }

  private clearCapoturni(): void {
    while (this.capoturniArray.length) {
      this.capoturniArray.removeAt(0);
    }
  }

  private persistStoredPassword(password: string | null): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (password) {
        localStorage.setItem(this.adminPasswordStorageKey, password);
      } else {
        localStorage.removeItem(this.adminPasswordStorageKey);
      }
    } catch (error) {
      console.warn('Unable to persist admin password', error);
    }
  }

  private readStoredPassword(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return localStorage.getItem(this.adminPasswordStorageKey);
    } catch {
      return null;
    }
  }

  private removeStoredPassword(): void {
    this.persistStoredPassword(null);
  }

  isCapoturnoRowSaving(index: number): boolean {
    return !!this.capoturnoRowSaving[index];
  }

  isCapoturnoRowDeleting(index: number): boolean {
    return !!this.capoturnoRowDeleting[index];
  }

  private setCapoturnoRowSaving(index: number, saving: boolean): void {
    if (saving) {
      this.capoturnoRowSaving = { ...this.capoturnoRowSaving, [index]: true };
      return;
    }
    const { [index]: _, ...rest } = this.capoturnoRowSaving;
    this.capoturnoRowSaving = rest;
  }

  private setCapoturnoRowDeleting(index: number, deleting: boolean): void {
    if (deleting) {
      this.capoturnoRowDeleting = { ...this.capoturnoRowDeleting, [index]: true };
      return;
    }
    const { [index]: _, ...rest } = this.capoturnoRowDeleting;
    this.capoturnoRowDeleting = rest;
  }
}
