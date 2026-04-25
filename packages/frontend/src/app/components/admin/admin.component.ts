import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { FlottaToscanaPageComponent } from '../flotta-toscana/flotta-toscana-page.component';
import { MaterialsRequestPageComponent } from '../materials-request/materials-request-page.component';
import { WorkOrderListComponent } from '../work-order-list/work-order-list.component';
import { AdminConfigService, CapoturnoConfig, TechnicianConfig } from '../../services/admin-config.service';
import { AdminSessionService } from '../../services/admin-session.service';

type AdminSection = 'ordini' | 'flotta' | 'materiali' | 'ti' | 'scadenze' | 'utenti';
type UtentiTab = 'capoturni' | 'tecnici';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    WorkOrderListComponent,
    FlottaToscanaPageComponent,
    MaterialsRequestPageComponent,
    DashboardComponent,
  ],
  template: `
    <!-- ── Login screen ─────────────────────────────────── -->
    <div class="admin-login-wrap" *ngIf="!adminLoggedIn">
      <div class="panel-shell">
        <div class="panel-heading">
          <h2>Accesso Admin</h2>
          <span class="panel-subtitle">Inserisci la password amministratore per accedere.</span>
        </div>
        <p *ngIf="loginError" class="login-message error">{{ loginError }}</p>
        <div class="field">
          <label>Password</label>
          <input
            type="password"
            [(ngModel)]="passwordInput"
            placeholder="Password amministratore"
            (keydown.enter)="doLogin()"
          />
        </div>
        <button class="btn btn-primary" (click)="doLogin()" [disabled]="loginLoading">
          {{ loginLoading ? 'Accesso...' : 'Accedi come admin' }}
        </button>
      </div>
    </div>

    <!-- ── Admin layout (logged in) ──────────────────────── -->
    <ng-container *ngIf="adminLoggedIn">

      <!-- Collapsible nav sidebar -->
      <div class="nav-sidebar">
        <div class="nav-sidebar-inner">

          <div class="nav-item" [class.active]="adminSection === 'ordini'" (click)="setSection('ordini')" title="Ordini di lavoro">
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="2"/>
                <line x1="9" y1="12" x2="15" y2="12"/>
                <line x1="9" y1="16" x2="13" y2="16"/>
              </svg>
            </span>
            <span class="nav-label">Ordini di lavoro</span>
          </div>

          <div class="nav-item" [class.active]="adminSection === 'flotta'" (click)="setSection('flotta')" title="Flotta Toscana">
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="6" width="22" height="12" rx="3"/>
                <path d="M1 12h22"/>
                <circle cx="6" cy="18" r="2"/>
                <circle cx="18" cy="18" r="2"/>
                <path d="M6 6V4"/><path d="M18 6V4"/>
                <path d="M4 18h2M18 18h2"/>
                <path d="M9 9h6"/>
              </svg>
            </span>
            <span class="nav-label">Flotta Toscana</span>
          </div>

          <div class="nav-item" [class.active]="adminSection === 'materiali'" (click)="setSection('materiali')" title="Richieste materiali">
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </span>
            <span class="nav-label">Richieste materiali</span>
          </div>

          <div class="nav-item" [class.active]="adminSection === 'ti'" (click)="setSection('ti')" title="Richieste TI">
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </span>
            <span class="nav-label">Richieste TI</span>
          </div>

          <div class="nav-item" [class.active]="adminSection === 'scadenze'" (click)="setSection('scadenze')" title="Scadenze">
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </span>
            <span class="nav-label">Scadenze</span>
          </div>

          <div class="nav-item nav-item-utenti" [class.active]="adminSection === 'utenti'" (click)="setSection('utenti')" title="Utenti">
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </span>
            <span class="nav-label">Utenti</span>
          </div>

        </div>
      </div>

      <!-- ── Section content ── -->
      <ng-container [ngSwitch]="adminSection">

        <!-- Ordini -->
        <ng-container *ngSwitchCase="'ordini'">
          <aside class="sidebar">
            <div class="sidebar-content">
              <div class="assigned-header">
                <h2 class="sidebar-title">ORDINI DI LAVORO</h2>
              </div>
              <app-work-order-list></app-work-order-list>
            </div>
          </aside>
          <main class="main-content">
            <app-dashboard></app-dashboard>
          </main>
        </ng-container>

        <app-flotta-toscana-page *ngSwitchCase="'flotta'"></app-flotta-toscana-page>
        <app-materials-request-page *ngSwitchCase="'materiali'"></app-materials-request-page>

        <div *ngSwitchCase="'ti'" class="section-placeholder">
          <div class="placeholder-icon">🖥️</div>
          <p class="placeholder-title">Richieste TI</p>
          <p class="placeholder-subtitle">Sezione in sviluppo</p>
        </div>

        <div *ngSwitchCase="'scadenze'" class="section-placeholder">
          <div class="placeholder-icon">📅</div>
          <p class="placeholder-title">Scadenze</p>
          <p class="placeholder-subtitle">Sezione in sviluppo</p>
        </div>

        <!-- Utenti -->
        <div *ngSwitchCase="'utenti'" class="utenti-page">
          <div class="utenti-tabs">
            <button class="utenti-tab" [class.active]="utentiTab === 'capoturni'" (click)="utentiTab = 'capoturni'">Capoturni</button>
            <button class="utenti-tab" [class.active]="utentiTab === 'tecnici'" (click)="utentiTab = 'tecnici'">Tecnici</button>
          </div>

          <p *ngIf="utentiError" class="config-feedback error">{{ utentiError }}</p>
          <p *ngIf="utentiSuccess" class="config-feedback success">{{ utentiSuccess }}</p>

          <!-- Capoturni -->
          <ng-container *ngIf="utentiTab === 'capoturni'">
            <form [formGroup]="capoturniForm">
              <div formArrayName="capoturni" class="technicians-grid">
                <div
                  *ngFor="let ctrl of capoturniArray.controls; let i = index"
                  [formGroupName]="i"
                  class="technician-card"
                >
                  <div class="technician-card-fields">
                    <label class="tc-field">
                      <span class="tc-label">Nome</span>
                      <input formControlName="name" placeholder="Nome capoturno" class="tc-input" />
                    </label>
                    <label class="tc-field">
                      <span class="tc-label">Nickname</span>
                      <input formControlName="nickname" placeholder="Nickname" class="tc-input" />
                    </label>
                    <label class="tc-field">
                      <span class="tc-label">Matricola</span>
                      <input formControlName="matricola" placeholder="Matricola" class="tc-input" />
                    </label>
                    <label class="tc-field">
                      <span class="tc-label">Ruolo</span>
                      <select formControlName="role" class="tc-input" style="cursor:pointer">
                        <option value="capoturno">Capoturno</option>
                        <option value="admin">Admin</option>
                      </select>
                    </label>
                  </div>
                  <div class="technician-card-actions">
                    <button type="button" class="btn btn-danger-sm" (click)="removeCapoturno(i)" [disabled]="capoturnoRowDeleting[i]">
                      {{ capoturnoRowDeleting[i] ? 'Rimozione...' : 'Rimuovi' }}
                    </button>
                    <button type="button" class="btn btn-save" (click)="saveCapoturno(i)" [disabled]="capoturnoRowSaving[i] || ctrl.invalid">
                      {{ capoturnoRowSaving[i] ? 'Salvataggio...' : 'Salva' }}
                    </button>
                  </div>
                </div>
                <div *ngIf="capoturniArray.length === 0" class="technicians-empty">
                  <p>Nessun capoturno configurato.</p>
                </div>
              </div>
            </form>
            <button class="btn btn-ghost" (click)="addCapoturno()">+ Aggiungi capoturno</button>
          </ng-container>

          <!-- Tecnici -->
          <ng-container *ngIf="utentiTab === 'tecnici'">
            <form [formGroup]="tecniciForm">
              <div formArrayName="tecnici" class="technicians-grid">
                <div
                  *ngFor="let ctrl of tecniciArray.controls; let i = index"
                  [formGroupName]="i"
                  class="technician-card"
                >
                  <div class="technician-card-fields">
                    <label class="tc-field">
                      <span class="tc-label">Nome</span>
                      <input formControlName="name" placeholder="Nome tecnico" class="tc-input" />
                    </label>
                    <label class="tc-field">
                      <span class="tc-label">Nickname</span>
                      <input formControlName="nickname" placeholder="Nickname" class="tc-input" />
                    </label>
                    <label class="tc-field">
                      <span class="tc-label">Matricola</span>
                      <input formControlName="matricola" placeholder="Matricola" class="tc-input" />
                    </label>
                    <label class="tc-field">
                      <span class="tc-label">Team</span>
                      <input formControlName="team" placeholder="Team" class="tc-input" />
                    </label>
                  </div>
                  <div class="technician-card-actions">
                    <button type="button" class="btn btn-danger-sm" (click)="removeTecnico(i)" [disabled]="tecnicoRowDeleting[i]">
                      {{ tecnicoRowDeleting[i] ? 'Rimozione...' : 'Rimuovi' }}
                    </button>
                    <button type="button" class="btn btn-save" (click)="saveTecnico(i)" [disabled]="tecnicoRowSaving[i] || ctrl.invalid">
                      {{ tecnicoRowSaving[i] ? 'Salvataggio...' : 'Salva' }}
                    </button>
                  </div>
                </div>
                <div *ngIf="tecniciArray.length === 0" class="technicians-empty">
                  <p>Nessun tecnico configurato.</p>
                </div>
              </div>
            </form>
            <button class="btn btn-ghost" (click)="addTecnico()">+ Aggiungi tecnico</button>
          </ng-container>
        </div>

      </ng-container>
    </ng-container>
  `,
  styles: [`
    :host {
      display: contents;
    }

    /* ── Login ── */
    .admin-login-wrap {
      display: flex;
      align-items: stretch;
      justify-content: center;
      flex: 1;
      padding: 0 24px;
    }

    .panel-shell {
      flex: 1;
      background: rgba(12, 14, 28, 0.95);
      padding: 32px;
      border-radius: 28px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .panel-heading h2 {
      margin: 0;
      font-size: 26px;
      color: var(--text-primary);
    }

    .panel-subtitle {
      color: var(--text-secondary);
      font-size: 13px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-secondary);
    }

    .field input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: var(--text-primary);
      border-radius: 10px;
      padding: 12px;
      font-size: 14px;
    }

    .login-message {
      font-size: 12px;
      padding: 8px 12px;
      border-radius: 8px;
      margin: 0;
    }

    .login-message.error {
      background: rgba(255, 77, 79, 0.12);
      color: #ff6b6b;
    }

    .btn {
      font-size: 13px;
      font-weight: 600;
      border-radius: 999px;
      padding: 10px 20px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .btn-primary {
      background: linear-gradient(180deg, #7bc7ff, #4b6ef5);
      color: #02050c;
      border: none;
      box-shadow: 0 12px 32px rgba(75, 110, 245, 0.35);
      width: fit-content;
      padding: 14px 28px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-primary:hover:not([disabled]) {
      transform: translateY(-1px);
      box-shadow: 0 14px 34px rgba(75, 110, 245, 0.45);
    }

    .btn-primary[disabled] {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* ── Nav sidebar (identical to capoturno) ── */
    .nav-sidebar {
      flex-shrink: 0;
      width: 60px;
      position: relative;
      align-self: stretch;
      z-index: 20;
    }

    .nav-sidebar-inner {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 60px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      padding: 10px 0;
      gap: 2px;
      overflow: hidden;
      transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(18px) saturate(160%);
      -webkit-backdrop-filter: blur(18px) saturate(160%);
    }

    .nav-sidebar-inner:hover {
      width: 220px;
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 18px;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.35);
      transition: color 0.15s ease;
      white-space: nowrap;
      user-select: none;
    }

    .nav-item:hover { color: rgba(255, 255, 255, 0.7); }

    .nav-item.active { color: rgba(255, 255, 255, 0.4); }

    .nav-item.active .nav-icon {
      color: #7bc7ff;
      filter: drop-shadow(0 0 6px rgba(123, 199, 255, 0.55));
    }

    .nav-item-utenti.active .nav-icon {
      color: #a78bfa;
      filter: drop-shadow(0 0 6px rgba(167, 139, 250, 0.55));
    }

    .nav-icon {
      flex-shrink: 0;
      width: 22px; height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-icon svg { width: 20px; height: 20px; display: block; }

    .nav-label {
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.3px;
      opacity: 0;
      transition: opacity 0.12s ease 0.08s;
      pointer-events: none;
    }

    .nav-sidebar-inner:hover .nav-label { opacity: 1; }

    /* ── Sidebar (work order list) ── */
    .sidebar {
      width: 320px;
      background: rgba(17, 22, 35, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 18px;
      padding: 18px 0;
      box-shadow: var(--glass-shadow);
    }

    .sidebar-content {
      padding: 12px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .assigned-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .sidebar-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--text-secondary);
    }

    .main-content {
      flex: 1;
      background: rgba(9, 13, 26, 0.92);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 32px;
      box-shadow: var(--glass-shadow);
      overflow-y: auto;
    }

    /* ── Section placeholders ── */
    .section-placeholder {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 14px;
      background: rgba(9, 13, 26, 0.92);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: var(--glass-shadow);
    }

    .placeholder-icon { font-size: 52px; opacity: 0.35; line-height: 1; }
    .placeholder-title { font-size: 20px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .placeholder-subtitle { font-size: 13px; color: var(--text-secondary); margin: 0; }

    /* ── Utenti page ── */
    .utenti-page {
      flex: 1;
      background: rgba(9, 13, 26, 0.92);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 24px;
      box-shadow: var(--glass-shadow);
      display: flex;
      flex-direction: column;
      gap: 20px;
      overflow-y: auto;
    }

    .utenti-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 14px;
    }

    .utenti-tab {
      padding: 8px 20px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: transparent;
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .utenti-tab.active {
      background: rgba(167, 139, 250, 0.15);
      border-color: rgba(167, 139, 250, 0.5);
      color: #a78bfa;
    }

    .utenti-tab:not(.active):hover {
      border-color: rgba(255, 255, 255, 0.2);
      color: var(--text-primary);
    }

    .config-feedback {
      font-size: 12px;
      border-radius: 10px;
      padding: 8px 12px;
      margin: 0;
    }

    .config-feedback.error {
      background: rgba(255, 77, 79, 0.12);
      color: #ff6b6b;
    }

    .config-feedback.success {
      background: rgba(76, 175, 80, 0.12);
      color: #82ffa9;
    }

    .technicians-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 14px;
    }

    .technician-card {
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 16px;
      background: rgba(18, 22, 42, 0.85);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .technician-card-fields {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .tc-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tc-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-secondary);
    }

    .tc-input {
      border-radius: 10px;
      background: rgba(17, 22, 35, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--text-primary);
      padding: 9px 12px;
      font-size: 13px;
      width: 100%;
      box-sizing: border-box;
    }

    .technician-card-actions {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    .technicians-empty {
      grid-column: 1 / -1;
      padding: 24px;
      border-radius: 14px;
      border: 1px dashed rgba(255, 255, 255, 0.2);
      text-align: center;
      color: var(--text-secondary);
      font-size: 13px;
    }

    .btn-ghost {
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-secondary);
      border-color: rgba(255, 255, 255, 0.2);
      align-self: flex-start;
    }

    .btn-ghost:hover {
      border-color: rgba(167, 139, 250, 0.5);
      color: #a78bfa;
    }

    .btn-save {
      background: linear-gradient(180deg, #7bc7ff, #4b6ef5);
      color: #030712;
      border: none;
      flex: 1;
    }

    .btn-save:hover:not([disabled]) { transform: translateY(-1px); }
    .btn-save[disabled] { opacity: 0.45; cursor: not-allowed; }

    .btn-danger-sm {
      background: rgba(255, 77, 79, 0.08);
      color: #ff6b6b;
      border-color: rgba(255, 77, 79, 0.3);
    }

    .btn-danger-sm:hover:not([disabled]) {
      background: rgba(255, 77, 79, 0.16);
      border-color: rgba(255, 77, 79, 0.5);
    }

    .btn-danger-sm[disabled] { opacity: 0.45; cursor: not-allowed; }

    @media (max-width: 1100px) {
      .sidebar { width: 100%; max-height: 55vh; overflow-y: auto; }
    }

    @media (max-width: 768px) {
      .admin-login-wrap { padding: 0; }
      .panel-shell { padding: 24px 18px; border-radius: 20px; }
      .main-content { padding: 20px; }
    }
  `],
})
export class AdminComponent implements OnInit {
  adminLoggedIn = false;
  adminSection: AdminSection = 'ordini';
  utentiTab: UtentiTab = 'capoturni';

  passwordInput = '';
  loginError: string | null = null;
  loginLoading = false;
  private currentPassword = '';
  private readonly storageKey = 'rail-service.admin-password';

  utentiError: string | null = null;
  utentiSuccess: string | null = null;

  capoturniForm: FormGroup;
  tecniciForm: FormGroup;
  capoturnoRowSaving: Record<number, boolean> = {};
  capoturnoRowDeleting: Record<number, boolean> = {};
  tecnicoRowSaving: Record<number, boolean> = {};
  tecnicoRowDeleting: Record<number, boolean> = {};

  constructor(
    private fb: FormBuilder,
    private adminConfigService: AdminConfigService,
    private adminSessionService: AdminSessionService,
  ) {
    this.capoturniForm = this.fb.group({ capoturni: this.fb.array([]) });
    this.tecniciForm = this.fb.group({ tecnici: this.fb.array([]) });
  }

  ngOnInit(): void {
    const stored = this.readStoredPassword();
    if (stored) {
      this.passwordInput = stored;
      this.doLogin();
    }
    // React to logout triggered externally (e.g. header avatar button)
    this.adminSessionService.isLoggedIn().subscribe((loggedIn) => {
      if (!loggedIn && this.adminLoggedIn) {
        this.adminLoggedIn = false;
        this.currentPassword = '';
        this.passwordInput = '';
        this.loginError = null;
        this.clearCapoturni();
        this.clearTecnici();
        this.adminSection = 'ordini';
      }
    });
  }

  get capoturniArray(): FormArray {
    return this.capoturniForm.get('capoturni') as FormArray;
  }

  get tecniciArray(): FormArray {
    return this.tecniciForm.get('tecnici') as FormArray;
  }

  setSection(section: AdminSection): void {
    this.adminSection = section;
  }

  doLogin(): void {
    if (!this.passwordInput) {
      this.loginError = 'Inserisci la password amministratore.';
      return;
    }
    this.loginLoading = true;
    this.loginError = null;
    this.adminConfigService.getCapoturni(this.passwordInput).subscribe({
      next: (capoturni) => {
        this.currentPassword = this.passwordInput;
        this.persistStoredPassword(this.passwordInput);
        this.adminLoggedIn = true;
        this.adminSessionService.setLoggedIn(true);
        this.loginLoading = false;
        this.setCapoturni(capoturni);
        this.loadTecnici();
      },
      error: (err) => {
        this.loginLoading = false;
        this.loginError = err?.error?.error ?? 'Password errata o servizio non raggiungibile.';
      },
    });
  }

  doLogout(): void {
    this.removeStoredPassword();
    this.adminSessionService.clearSession(); // triggers subscriber above
  }

  private loadTecnici(): void {
    this.adminConfigService.getTechnicians(this.currentPassword).subscribe({
      next: (tecnici) => this.setTecnici(tecnici),
      error: () => { /* non critico */ },
    });
  }

  // ── Capoturni ──────────────────────────────────────────────────────────

  addCapoturno(): void {
    this.capoturniArray.push(this.createCapoturnoGroup());
  }

  saveCapoturno(index: number): void {
    const ctrl = this.capoturniArray.at(index);
    if (!ctrl || ctrl.invalid) { ctrl?.markAllAsTouched(); return; }
    this.capoturnoRowSaving = { ...this.capoturnoRowSaving, [index]: true };
    this.adminConfigService.saveCapoturno(this.currentPassword, ctrl.value as CapoturnoConfig).subscribe({
      next: (saved) => {
        ctrl.patchValue(saved);
        this.utentiSuccess = `Capoturno ${saved.name} salvato`;
        this.utentiError = null;
        const { [index]: _, ...rest } = this.capoturnoRowSaving;
        this.capoturnoRowSaving = rest;
      },
      error: (err) => {
        this.utentiError = err?.error?.error ?? 'Errore salvataggio';
        this.utentiSuccess = null;
        const { [index]: _, ...rest } = this.capoturnoRowSaving;
        this.capoturnoRowSaving = rest;
      },
    });
  }

  removeCapoturno(index: number): void {
    const ctrl = this.capoturniArray.at(index);
    const name = ctrl?.get('name')?.value ?? 'questo capoturno';
    if (!window.confirm(`Confermi la rimozione di ${name}?`)) return;
    const id = ctrl?.get('id')?.value;
    if (!id) { this.capoturniArray.removeAt(index); return; }
    this.capoturnoRowDeleting = { ...this.capoturnoRowDeleting, [index]: true };
    this.adminConfigService.deleteCapoturno(this.currentPassword, id).subscribe({
      next: (list) => {
        this.utentiSuccess = 'Capoturno rimosso';
        this.utentiError = null;
        this.setCapoturni(list);
      },
      error: (err) => {
        this.utentiError = err?.error?.error ?? 'Errore rimozione';
        this.utentiSuccess = null;
        const { [index]: _, ...rest } = this.capoturnoRowDeleting;
        this.capoturnoRowDeleting = rest;
      },
    });
  }

  private createCapoturnoGroup(capo?: CapoturnoConfig): FormGroup {
    return this.fb.group({
      id: [capo?.id ?? ''],
      name: [capo?.name ?? '', Validators.required],
      nickname: [capo?.nickname ?? '', Validators.required],
      matricola: [capo?.matricola ?? '', Validators.required],
      role: [capo?.role ?? 'capoturno'],
    });
  }

  private setCapoturni(list: CapoturnoConfig[]): void {
    this.clearCapoturni();
    list.forEach((c) => this.capoturniArray.push(this.createCapoturnoGroup(c)));
  }

  private clearCapoturni(): void {
    while (this.capoturniArray.length) this.capoturniArray.removeAt(0);
  }

  // ── Tecnici ────────────────────────────────────────────────────────────

  addTecnico(): void {
    this.tecniciArray.push(this.createTecnicoGroup());
  }

  saveTecnico(index: number): void {
    const ctrl = this.tecniciArray.at(index);
    if (!ctrl || ctrl.invalid) { ctrl?.markAllAsTouched(); return; }
    this.tecnicoRowSaving = { ...this.tecnicoRowSaving, [index]: true };
    this.adminConfigService.saveTechnician(this.currentPassword, ctrl.value as TechnicianConfig).subscribe({
      next: (saved) => {
        ctrl.patchValue(saved);
        this.utentiSuccess = `Tecnico ${saved.name} salvato`;
        this.utentiError = null;
        const { [index]: _, ...rest } = this.tecnicoRowSaving;
        this.tecnicoRowSaving = rest;
      },
      error: (err) => {
        this.utentiError = err?.error?.error ?? 'Errore salvataggio';
        this.utentiSuccess = null;
        const { [index]: _, ...rest } = this.tecnicoRowSaving;
        this.tecnicoRowSaving = rest;
      },
    });
  }

  removeTecnico(index: number): void {
    const ctrl = this.tecniciArray.at(index);
    const name = ctrl?.get('name')?.value ?? 'questo tecnico';
    if (!window.confirm(`Confermi la rimozione di ${name}?`)) return;
    const id = ctrl?.get('id')?.value;
    if (!id) { this.tecniciArray.removeAt(index); return; }
    this.tecnicoRowDeleting = { ...this.tecnicoRowDeleting, [index]: true };
    this.adminConfigService.deleteTechnician(this.currentPassword, id).subscribe({
      next: (list) => {
        this.utentiSuccess = 'Tecnico rimosso';
        this.utentiError = null;
        this.setTecnici(list);
      },
      error: (err) => {
        this.utentiError = err?.error?.error ?? 'Errore rimozione';
        this.utentiSuccess = null;
        const { [index]: _, ...rest } = this.tecnicoRowDeleting;
        this.tecnicoRowDeleting = rest;
      },
    });
  }

  private createTecnicoGroup(t?: TechnicianConfig): FormGroup {
    return this.fb.group({
      id: [t?.id ?? ''],
      name: [t?.name ?? '', Validators.required],
      nickname: [t?.nickname ?? '', Validators.required],
      matricola: [t?.matricola ?? '', Validators.required],
      team: [t?.team ?? '', Validators.required],
    });
  }

  private setTecnici(list: TechnicianConfig[]): void {
    this.clearTecnici();
    list.forEach((t) => this.tecniciArray.push(this.createTecnicoGroup(t)));
  }

  private clearTecnici(): void {
    while (this.tecniciArray.length) this.tecniciArray.removeAt(0);
  }

  // ── Password storage ───────────────────────────────────────────────────

  private persistStoredPassword(pw: string): void {
    try { localStorage.setItem(this.storageKey, pw); } catch { /* ignore */ }
  }

  private readStoredPassword(): string | null {
    try { return localStorage.getItem(this.storageKey); } catch { return null; }
  }

  private removeStoredPassword(): void {
    try { localStorage.removeItem(this.storageKey); } catch { /* ignore */ }
  }
}
