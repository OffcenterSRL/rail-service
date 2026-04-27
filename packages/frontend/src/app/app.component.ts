import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { APP_VERSION } from './app-version';
import { FlottaToscanaPageComponent } from './components/flotta-toscana/flotta-toscana-page.component';
import { MaterialsRequestPageComponent } from './components/materials-request/materials-request-page.component';
import { WorkOrderListComponent } from './components/work-order-list/work-order-list.component';
import { AdminConfigService, CapoturnoConfig, TechnicianConfig } from './services/admin-config.service';
import { AuthService, CapoturnoSession } from './services/auth.service';
import { CapoturnoSessionService } from './services/capoturno-session.service';
import { DashboardService, DashboardStats } from './services/dashboard.service';
import { Task, WorkOrder, WorkOrderService } from './services/work-order.service';
import { ThemeService, ThemeName } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterOutlet,
    WorkOrderListComponent,
    MaterialsRequestPageComponent,
    FlottaToscanaPageComponent,
  ],
  template: `
    <div class="app-shell">

      <!-- Shift selection modal -->
      <div class="shift-modal-backdrop" *ngIf="showShiftModal">
        <div class="shift-modal">
          <div class="shift-modal-header">
            <span class="shift-modal-title">Seleziona il turno</span>
            <p class="shift-modal-sub">Scegli il turno di lavoro per questa sessione</p>
          </div>
          <div class="shift-options">
            <button
              *ngFor="let option of capoturnoShiftOptions"
              class="shift-option"
              [class.selected]="capoturnoShift === option"
              (click)="capoturnoShift = option"
            >
              <span class="shift-option-dot"></span>
              {{ option }}
            </button>
          </div>
          <button class="shift-confirm-btn" (click)="confirmShift()">
            Entra nel programma
          </button>
        </div>
      </div>

      <!-- Backdrop to close profile dropdown -->
      <div
        class="profile-backdrop"
        *ngIf="profileDropdownOpen"
        (click)="profileDropdownOpen = false"
      ></div>

      <div class="main-layout">
        <ng-container *ngIf="capoturnoSession; else capoturnoLogin">

          <!-- Collapsible nav sidebar -->
          <div class="nav-sidebar">
            <div class="nav-sidebar-inner">
              <div class="nav-item" [class.active]="capoturnoSection === 'ordini'" (click)="setCapoturnoSection('ordini')" title="Ordini di lavoro">
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
              <div class="nav-item" [class.active]="capoturnoSection === 'flotta'" (click)="setCapoturnoSection('flotta')" title="Flotta Toscana">
                <span class="nav-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="1" y="6" width="22" height="12" rx="3"/>
                    <path d="M1 12h22"/>
                    <circle cx="6" cy="18" r="2"/>
                    <circle cx="18" cy="18" r="2"/>
                    <path d="M6 6V4"/>
                    <path d="M18 6V4"/>
                    <path d="M4 18h2M18 18h2"/>
                    <path d="M9 9h6"/>
                  </svg>
                </span>
                <span class="nav-label">Flotta Toscana</span>
              </div>
              <div class="nav-item" [class.active]="capoturnoSection === 'materiali'" (click)="setCapoturnoSection('materiali')" title="Richieste materiali">
                <span class="nav-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </span>
                <span class="nav-label">Richieste materiali</span>
              </div>
              <div class="nav-item" [class.active]="capoturnoSection === 'ti'" (click)="setCapoturnoSection('ti')" title="Richieste TI">
                <span class="nav-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </span>
                <span class="nav-label">Richieste TI</span>
              </div>
              <div class="nav-item" [class.active]="capoturnoSection === 'scadenze'" (click)="setCapoturnoSection('scadenze')" title="Scadenze">
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
              <!-- Utenti: visible only for admin-role capoturno -->
              <div class="nav-item nav-item-utenti" *ngIf="capoturnoSession?.role === 'admin'"
                   [class.active]="capoturnoSection === 'utenti'" (click)="setCapoturnoSection('utenti')" title="Utenti">
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

            <!-- Profile avatar at sidebar bottom (outside inner to avoid overflow clip) -->
            <div class="nav-user-area">
              <button class="nav-user-avatar" (click)="toggleProfileDropdown()" [title]="capoturnoName">
                {{ getInitials() }}
              </button>
              <div class="nav-user-dropdown" *ngIf="profileDropdownOpen">
                <div class="profile-dropdown-name">{{ capoturnoName }}</div>
                <div class="profile-dropdown-shift">Turno {{ getShiftLabel(capoturnoShift) }}</div>
                <hr class="profile-dropdown-divider" />
                <button class="profile-theme-btn" (click)="toggleTheme()">
                  <svg *ngIf="currentTheme === 'dark'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                  <svg *ngIf="currentTheme === 'light'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                  {{ currentTheme === 'dark' ? 'Tema chiaro' : 'Tema scuro' }}
                </button>
                <hr class="profile-dropdown-divider" />
                <button class="profile-logout-btn" (click)="logoutCapoturno()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Esci
                </button>
              </div>
            </div>
          </div>

          <!-- Section content -->
          <ng-container [ngSwitch]="capoturnoSection">
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
                <router-outlet></router-outlet>
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

            <!-- Utenti (solo admin) -->
            <div *ngSwitchCase="'utenti'" class="utenti-page">
              <!-- Password unlock -->
              <ng-container *ngIf="!utentiUnlocked">
                <div class="utenti-unlock">
                  <h3 class="utenti-unlock-title">Gestione Utenti</h3>
                  <p class="utenti-unlock-sub">Inserisci la password amministratore per continuare.</p>
                  <p *ngIf="utentiLoginError" class="config-feedback error">{{ utentiLoginError }}</p>
                  <div class="field">
                    <label>Password amministratore</label>
                    <input
                      type="password"
                      [(ngModel)]="utentiPassword"
                      placeholder="Password"
                      (keydown.enter)="unlockUtenti()"
                    />
                  </div>
                  <button class="btn btn-primary" (click)="unlockUtenti()" [disabled]="utentiLoginLoading">
                    {{ utentiLoginLoading ? 'Accesso...' : 'Accedi' }}
                  </button>
                </div>
              </ng-container>

              <!-- Unlocked: CRUD -->
              <ng-container *ngIf="utentiUnlocked">
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
                      <div *ngFor="let ctrl of capoturniArray.controls; let i = index"
                           [formGroupName]="i" class="technician-card">
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
                            <select formControlName="role" class="tc-input tc-select">
                              <option value="capoturno">Capoturno</option>
                              <option value="admin">Admin</option>
                            </select>
                          </label>
                        </div>
                        <div class="technician-card-actions">
                          <button type="button" class="btn btn-danger-sm" (click)="removeCapoturnoRow(i)" [disabled]="capoturnoRowDeleting[i]">
                            {{ capoturnoRowDeleting[i] ? 'Rimozione...' : 'Rimuovi' }}
                          </button>
                          <button type="button" class="btn btn-save" (click)="saveCapoturnoRow(i)" [disabled]="capoturnoRowSaving[i] || ctrl.invalid">
                            {{ capoturnoRowSaving[i] ? 'Salvataggio...' : 'Salva' }}
                          </button>
                        </div>
                      </div>
                      <div *ngIf="capoturniArray.length === 0" class="technicians-empty">
                        <p>Nessun capoturno configurato.</p>
                      </div>
                    </div>
                  </form>
                  <button class="btn btn-ghost" (click)="addCapoturnoRow()">+ Aggiungi capoturno</button>
                </ng-container>

                <!-- Tecnici -->
                <ng-container *ngIf="utentiTab === 'tecnici'">
                  <form [formGroup]="tecniciForm">
                    <div formArrayName="tecnici" class="technicians-grid">
                      <div *ngFor="let ctrl of tecniciArray.controls; let i = index"
                           [formGroupName]="i" class="technician-card">
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
                          <button type="button" class="btn btn-danger-sm" (click)="removeTecnicoRow(i)" [disabled]="tecnicoRowDeleting[i]">
                            {{ tecnicoRowDeleting[i] ? 'Rimozione...' : 'Rimuovi' }}
                          </button>
                          <button type="button" class="btn btn-save" (click)="saveTecnicoRow(i)" [disabled]="tecnicoRowSaving[i] || ctrl.invalid">
                            {{ tecnicoRowSaving[i] ? 'Salvataggio...' : 'Salva' }}
                          </button>
                        </div>
                      </div>
                      <div *ngIf="tecniciArray.length === 0" class="technicians-empty">
                        <p>Nessun tecnico configurato.</p>
                      </div>
                    </div>
                  </form>
                  <button class="btn btn-ghost" (click)="addTecnicoRow()">+ Aggiungi tecnico</button>
                </ng-container>
              </ng-container>
            </div>
          </ng-container>

        </ng-container>

        <ng-template #capoturnoLogin>
          <div class="tecnico-panel">
            <div class="panel-shell">
              <div class="panel-heading">
                <h2>Login Capoturno</h2>
                <span class="panel-subtitle">
                  Accedi con nickname e matricola per gestire gli ordini.
                </span>
              </div>
              <p
                *ngIf="capoturnoLoginState"
                class="login-message"
                [class.success]="capoturnoLoginState.type === 'success'"
                [class.error]="capoturnoLoginState.type === 'error'"
              >
                {{ capoturnoLoginState.message }}
              </p>
              <div class="field">
                <label>Nickname</label>
                <input type="text" [(ngModel)]="capoturnoNickname" placeholder="es. Giulia" />
              </div>
              <div class="field">
                <label>Matricola</label>
                <input type="text" [(ngModel)]="capoturnoMatricola" placeholder="C-2001" />
              </div>
              <button class="btn btn-primary" (click)="loginCapoturno()">
                Accedi come capoturno
              </button>
            </div>
          </div>
        </ng-template>
      </div>
      <footer class="app-footer">Versione {{ appVersion }}</footer>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        color: var(--text-primary);
      }

      .app-shell {
        display: flex;
        flex-direction: column;
        gap: 20px;
        min-height: 100vh;
        padding: 20px 0;
        width: 100%;
        box-sizing: border-box;
        overflow-x: hidden;
      }

      .tecnico-panel {
        display: flex;
        align-items: stretch;
        justify-content: center;
        min-height: calc(100vh - 100px);
        padding: 0 24px;
        width: 100%;
      }

      .panel-shell {
        flex: 1;
        width: 100%;
        max-width: none;
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
      }

      .login-message {
        font-size: 12px;
        color: var(--text-secondary);
        margin: 0;
      }

      .login-message.success {
        color: var(--accent-lime);
      }

      .login-message.error {
        color: var(--error);
      }

      .panel-shell .btn {
        width: fit-content;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 14px 28px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 14px;
        border: none;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }

      .panel-shell .btn-primary {
        background: linear-gradient(180deg, #7bc7ff, #4b6ef5);
        color: #02050c;
        box-shadow: 0 12px 32px rgba(75, 110, 245, 0.35);
      }

      .panel-shell .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 14px 34px rgba(75, 110, 245, 0.35);
      }

      /* ── Shift selection modal ── */
      .shift-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.72);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }

      .shift-modal {
        background: #0f1625;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 22px;
        padding: 36px 40px 32px;
        width: 100%;
        max-width: 420px;
        display: flex;
        flex-direction: column;
        gap: 24px;
        box-shadow: 0 32px 80px rgba(0, 0, 0, 0.8);
      }

      .shift-modal-header {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .shift-modal-title {
        font-size: 20px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .shift-modal-sub {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 0;
      }

      .shift-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .shift-option {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px 20px;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-secondary);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s, color 0.15s;
        text-align: left;
      }

      .shift-option:hover {
        border-color: rgba(123, 199, 255, 0.3);
        background: rgba(123, 199, 255, 0.05);
        color: var(--text-primary);
      }

      .shift-option.selected {
        border-color: #7bc7ff;
        background: rgba(123, 199, 255, 0.1);
        color: var(--text-primary);
      }

      .shift-option-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.25);
        flex-shrink: 0;
        transition: background 0.15s, border-color 0.15s;
      }

      .shift-option.selected .shift-option-dot {
        background: #7bc7ff;
        border-color: #7bc7ff;
      }

      .shift-confirm-btn {
        background: linear-gradient(180deg, #7bc7ff, #4b6ef5);
        color: #02050c;
        border: none;
        padding: 14px 20px;
        border-radius: 14px;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 12px 32px rgba(75, 110, 245, 0.35);
        transition: transform 0.15s, box-shadow 0.15s;
      }

      .shift-confirm-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 16px 36px rgba(75, 110, 245, 0.45);
      }

      .profile-backdrop {
        position: fixed;
        inset: 0;
        z-index: 15;
      }

      .assigned-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .app-footer {
        padding: 12px 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        text-align: right;
        font-size: 12px;
        color: var(--text-secondary);
      }

      .main-layout {
        display: flex;
        flex: 1;
        gap: 16px;
        min-height: 0;
      }

      /* ── Collapsible nav sidebar ── */
      .nav-sidebar {
        flex-shrink: 0;
        width: 60px;
        position: relative;
        align-self: stretch;
        z-index: 20;
      }

      .nav-sidebar-inner {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
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
        border-radius: 0;
        user-select: none;
      }

      .nav-item:hover {
        color: rgba(255, 255, 255, 0.7);
      }

      .nav-item.active {
        color: rgba(255, 255, 255, 0.4);
      }

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
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .nav-icon svg {
        width: 20px;
        height: 20px;
        display: block;
      }

      .nav-label {
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.3px;
        opacity: 0;
        transition: opacity 0.12s ease 0.08s;
        pointer-events: none;
      }

      .nav-sidebar-inner:hover .nav-label {
        opacity: 1;
      }

      /* ── Nav user avatar (bottom of sidebar) ── */
      .nav-user-area {
        position: absolute;
        bottom: 10px;
        left: 10px;
        z-index: 30;
      }

      .nav-user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #7bc7ff, #4b6ef5);
        color: #02050c;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.5px;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 0 2px rgba(123, 199, 255, 0.3);
        transition: box-shadow 0.15s, transform 0.15s;
        flex-shrink: 0;
      }

      .nav-user-avatar:hover {
        transform: scale(1.06);
        box-shadow: 0 0 0 3px rgba(123, 199, 255, 0.5);
      }

      .nav-user-dropdown {
        position: absolute;
        left: 48px;
        bottom: 0;
        background: #0f1625;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        padding: 16px;
        min-width: 210px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        gap: 4px;
        z-index: 1500;
      }

      .profile-dropdown-name {
        font-size: 14px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .profile-dropdown-shift {
        font-size: 12px;
        color: var(--text-secondary);
      }

      .profile-dropdown-divider {
        border: none;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        margin: 8px 0 4px;
      }

      .profile-theme-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(123, 199, 255, 0.1);
        border: 1px solid rgba(123, 199, 255, 0.3);
        color: #7bc7ff;
        border-radius: 10px;
        padding: 9px 14px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        transition: background 0.15s, border-color 0.15s;
      }

      .profile-theme-btn:hover {
        background: rgba(123, 199, 255, 0.18);
        border-color: rgba(123, 199, 255, 0.55);
      }

      .profile-theme-btn svg {
        flex-shrink: 0;
      }

      .profile-logout-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 77, 79, 0.1);
        border: 1px solid rgba(255, 77, 79, 0.3);
        color: #ff6c6c;
        border-radius: 10px;
        padding: 9px 14px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        transition: background 0.15s, border-color 0.15s;
      }

      .profile-logout-btn:hover {
        background: rgba(255, 77, 79, 0.18);
        border-color: rgba(255, 77, 79, 0.55);
      }

      /* ── Section placeholder ── */
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

      .placeholder-icon {
        font-size: 52px;
        opacity: 0.35;
        line-height: 1;
      }

      .placeholder-title {
        font-size: 20px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }

      .placeholder-subtitle {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 0;
        letter-spacing: 0.3px;
      }

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

      .utenti-unlock {
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-width: 440px;
      }

      .utenti-unlock-title {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .utenti-unlock-sub {
        margin: 0;
        font-size: 13px;
        color: var(--text-secondary);
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

      .tc-select {
        cursor: pointer;
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
        .main-layout {
          flex-direction: column;
        }

        .sidebar {
          width: 100%;
          max-height: 55vh;
          overflow-y: auto;
        }
      }

      @media (max-width: 1024px) {
        .main-content {
          padding: 24px;
        }
      }

      @media (max-width: 768px) {
        .main-content {
          padding: 20px;
        }

        .panel-shell {
          padding: 24px 18px;
        }

        .tecnico-panel {
          padding: 0;
        }
      }

      @media (max-width: 600px) {
        .app-footer {
          text-align: center;
        }
      }

      @media (max-width: 420px) {
        .sidebar-content {
          padding: 10px 14px;
        }
      }
    `,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  capoturnoSection: 'ordini' | 'materiali' | 'ti' | 'scadenze' | 'flotta' | 'utenti' = 'ordini';
  capoturnoSession: CapoturnoSession | null = null;
  selectedWorkOrder: WorkOrder | null = null;
  capoturnoName = 'Capoturno';
  capoturnoNickname = '';
  capoturnoMatricola = '';
  capoturnoShift = 'Mattina (06-14)';
  readonly capoturnoShiftOptions = [
    'Mattina (06-14)',
    'Pomeriggio (14-22)',
    'Notte (22-06)',
  ];
  capoturnoLoginState: { type: 'success' | 'error'; message: string } | null = null;
  showShiftModal = false;
  profileDropdownOpen = false;
  currentTheme: ThemeName = 'dark';
  private pendingSession: CapoturnoSession | null = null;
  allWorkOrders: WorkOrder[] = [];
  appVersion = APP_VERSION;
  dashboardStats: DashboardStats = {
    interventions: 0,
    techniciansOnline: 0,
    shiftsCompleted: 0,
    activeTickets: 0,
    cancelledTickets: 0,
    lastUpdated: new Date().toISOString(),
  };

  // Utenti section state
  utentiPassword = '';
  utentiUnlocked = false;
  utentiLoginError: string | null = null;
  utentiLoginLoading = false;
  utentiTab: 'capoturni' | 'tecnici' = 'capoturni';
  utentiError: string | null = null;
  utentiSuccess: string | null = null;
  capoturniForm: FormGroup;
  tecniciForm: FormGroup;
  capoturnoRowSaving: Record<number, boolean> = {};
  capoturnoRowDeleting: Record<number, boolean> = {};
  tecnicoRowSaving: Record<number, boolean> = {};
  tecnicoRowDeleting: Record<number, boolean> = {};
  private utentiCurrentPassword = '';
  private readonly utentiStorageKey = 'rail-service.admin-password';

  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private capoturnoSessionService = inject(CapoturnoSessionService);
  private workOrderService = inject(WorkOrderService);
  private adminConfigService = inject(AdminConfigService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private workOrdersSub?: Subscription;
  private selectedWorkOrderSub?: Subscription;
  private themeSub?: Subscription;

  constructor() {
    this.capoturniForm = this.fb.group({ capoturni: this.fb.array([]) });
    this.tecniciForm = this.fb.group({ tecnici: this.fb.array([]) });
  }

  get capoturniArray(): FormArray {
    return this.capoturniForm.get('capoturni') as FormArray;
  }

  get tecniciArray(): FormArray {
    return this.tecniciForm.get('tecnici') as FormArray;
  }

  setCapoturnoSection(section: typeof this.capoturnoSection): void {
    this.capoturnoSection = section;
    if (section === 'utenti') {
      this.tryAutoUnlockUtenti();
    }
  }

  private tryAutoUnlockUtenti(): void {
    if (this.utentiUnlocked) return;
    try {
      const stored = localStorage.getItem(this.utentiStorageKey);
      if (stored) {
        this.utentiPassword = stored;
        this.unlockUtenti();
      }
    } catch { /* ignore */ }
  }

  unlockUtenti(): void {
    if (!this.utentiPassword) {
      this.utentiLoginError = 'Inserisci la password amministratore.';
      return;
    }
    this.utentiLoginLoading = true;
    this.utentiLoginError = null;
    this.adminConfigService.getCapoturni(this.utentiPassword).subscribe({
      next: (capoturni) => {
        this.utentiCurrentPassword = this.utentiPassword;
        try { localStorage.setItem(this.utentiStorageKey, this.utentiPassword); } catch { /* ignore */ }
        this.utentiUnlocked = true;
        this.utentiLoginLoading = false;
        this.setCapoturniList(capoturni);
        this.loadTecnici();
      },
      error: (err) => {
        this.utentiLoginLoading = false;
        this.utentiLoginError = err?.error?.error ?? 'Password errata o servizio non raggiungibile.';
      },
    });
  }

  private loadTecnici(): void {
    this.adminConfigService.getTechnicians(this.utentiCurrentPassword).subscribe({
      next: (tecnici) => this.setTecniciList(tecnici),
      error: () => { /* non critico */ },
    });
  }

  // ── Capoturni CRUD ──────────────────────────────────────────────────────

  addCapoturnoRow(): void {
    this.capoturniArray.push(this.buildCapoturnoGroup());
  }

  saveCapoturnoRow(index: number): void {
    const ctrl = this.capoturniArray.at(index);
    if (!ctrl || ctrl.invalid) { ctrl?.markAllAsTouched(); return; }
    this.capoturnoRowSaving = { ...this.capoturnoRowSaving, [index]: true };
    this.adminConfigService.saveCapoturno(this.utentiCurrentPassword, ctrl.value as CapoturnoConfig).subscribe({
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

  removeCapoturnoRow(index: number): void {
    const ctrl = this.capoturniArray.at(index);
    const name = ctrl?.get('name')?.value ?? 'questo capoturno';
    if (!window.confirm(`Confermi la rimozione di ${name}?`)) return;
    const id = ctrl?.get('id')?.value;
    if (!id) { this.capoturniArray.removeAt(index); return; }
    this.capoturnoRowDeleting = { ...this.capoturnoRowDeleting, [index]: true };
    this.adminConfigService.deleteCapoturno(this.utentiCurrentPassword, id).subscribe({
      next: (list) => {
        this.utentiSuccess = 'Capoturno rimosso';
        this.utentiError = null;
        this.setCapoturniList(list);
      },
      error: (err) => {
        this.utentiError = err?.error?.error ?? 'Errore rimozione';
        this.utentiSuccess = null;
        const { [index]: _, ...rest } = this.capoturnoRowDeleting;
        this.capoturnoRowDeleting = rest;
      },
    });
  }

  private buildCapoturnoGroup(capo?: CapoturnoConfig): FormGroup {
    return this.fb.group({
      id: [capo?.id ?? ''],
      name: [capo?.name ?? '', Validators.required],
      nickname: [capo?.nickname ?? '', Validators.required],
      matricola: [capo?.matricola ?? '', Validators.required],
      role: [capo?.role ?? 'capoturno'],
    });
  }

  private setCapoturniList(list: CapoturnoConfig[]): void {
    while (this.capoturniArray.length) this.capoturniArray.removeAt(0);
    list.forEach((c) => this.capoturniArray.push(this.buildCapoturnoGroup(c)));
  }

  // ── Tecnici CRUD ────────────────────────────────────────────────────────

  addTecnicoRow(): void {
    this.tecniciArray.push(this.buildTecnicoGroup());
  }

  saveTecnicoRow(index: number): void {
    const ctrl = this.tecniciArray.at(index);
    if (!ctrl || ctrl.invalid) { ctrl?.markAllAsTouched(); return; }
    this.tecnicoRowSaving = { ...this.tecnicoRowSaving, [index]: true };
    this.adminConfigService.saveTechnician(this.utentiCurrentPassword, ctrl.value as TechnicianConfig).subscribe({
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

  removeTecnicoRow(index: number): void {
    const ctrl = this.tecniciArray.at(index);
    const name = ctrl?.get('name')?.value ?? 'questo tecnico';
    if (!window.confirm(`Confermi la rimozione di ${name}?`)) return;
    const id = ctrl?.get('id')?.value;
    if (!id) { this.tecniciArray.removeAt(index); return; }
    this.tecnicoRowDeleting = { ...this.tecnicoRowDeleting, [index]: true };
    this.adminConfigService.deleteTechnician(this.utentiCurrentPassword, id).subscribe({
      next: (list) => {
        this.utentiSuccess = 'Tecnico rimosso';
        this.utentiError = null;
        this.setTecniciList(list);
      },
      error: (err) => {
        this.utentiError = err?.error?.error ?? 'Errore rimozione';
        this.utentiSuccess = null;
        const { [index]: _, ...rest } = this.tecnicoRowDeleting;
        this.tecnicoRowDeleting = rest;
      },
    });
  }

  private buildTecnicoGroup(t?: TechnicianConfig): FormGroup {
    return this.fb.group({
      id: [t?.id ?? ''],
      name: [t?.name ?? '', Validators.required],
      nickname: [t?.nickname ?? '', Validators.required],
      matricola: [t?.matricola ?? '', Validators.required],
      team: [t?.team ?? '', Validators.required],
    });
  }

  private setTecniciList(list: TechnicianConfig[]): void {
    while (this.tecniciArray.length) this.tecniciArray.removeAt(0);
    list.forEach((t) => this.tecniciArray.push(this.buildTecnicoGroup(t)));
  }

  // ── Capoturno login / session ────────────────────────────────────────────

  loginCapoturno(): void {
    if (!this.capoturnoNickname || !this.capoturnoMatricola) {
      this.capoturnoLoginState = {
        type: 'error',
        message: 'Inserisci nickname e matricola per accedere.',
      };
      return;
    }

    this.authService
      .loginCapoturno({
        nickname: this.capoturnoNickname,
        matricola: this.capoturnoMatricola,
      })
      .subscribe({
        next: (session) => {
          this.pendingSession = session;
          this.capoturnoShift = this.capoturnoShiftOptions[0];
          this.showShiftModal = true;
        },
        error: (error) => {
          const message = error?.error?.error ?? 'Errore durante il login capoturno.';
          this.capoturnoLoginState = { type: 'error', message };
        },
      });
  }

  getInitials(): string {
    const parts = this.capoturnoName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }

  toggleProfileDropdown(): void {
    this.profileDropdownOpen = !this.profileDropdownOpen;
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.themeService.setTheme(newTheme);
  }

  confirmShift(): void {
    if (!this.pendingSession) return;
    this.capoturnoSessionService.setSession({
      ...this.pendingSession,
      shift: this.capoturnoShift,
    });
    this.capoturnoLoginState = { type: 'success', message: this.pendingSession.message };
    this.pendingSession = null;
    this.showShiftModal = false;
  }

  ngOnInit(): void {
    this.loadDashboardStats();
    this.themeSub = this.themeService.currentTheme$.subscribe((theme) => {
      this.currentTheme = theme;
    });
    this.capoturnoSessionService.getSession().subscribe((session) => {
      this.capoturnoSession = session;
      this.capoturnoName = session?.name ?? 'Capoturno';
      if (session?.shift) {
        this.capoturnoShift = session.shift;
      }
    });
    this.workOrdersSub = this.workOrderService.getWorkOrders().subscribe((orders) => {
      this.allWorkOrders = orders;
    });
    this.selectedWorkOrderSub = this.workOrderService
      .getSelectedWorkOrder()
      .subscribe((order) => {
        this.selectedWorkOrder = order;
      });
  }

  private loadDashboardStats(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (stats) => {
        this.dashboardStats = stats;
      },
      error: () => {
        this.dashboardStats = {
          interventions: 0,
          techniciansOnline: 0,
          shiftsCompleted: 0,
          activeTickets: 0,
          cancelledTickets: 0,
          lastUpdated: new Date().toISOString(),
        };
      },
    });
  }

  getShiftLabel(shift?: string): string {
    if (!shift) {
      return 'In corso';
    }
    const normalized = shift.toLowerCase();
    if (normalized.includes('mattina') || normalized.includes('06-14')) {
      return 'Mattina';
    }
    if (normalized.includes('pomeriggio') || normalized.includes('14-22')) {
      return 'Pomeriggio';
    }
    if (normalized.includes('notte') || normalized.includes('22-06')) {
      return 'Notte';
    }
    return shift;
  }

  getOpenOrdersForShift(): WorkOrder[] {
    const shift = this.capoturnoShift;
    return this.allWorkOrders.filter(
      (order) => order.shift === shift && order.status !== 'completed' && order.status !== 'cancelled',
    );
  }

  private getTaskStatusStyle(status: Task['status']): string {
    if (status === 'in_progress') return 'background-color:#FFF8CC;color:#997700;';
    if (status === 'risolte') return 'background-color:#D4F7E0;color:#166534;';
    if (status === 'rimandato') return 'background-color:#FFD5D5;color:#991B1B;';
    return 'background-color:#FFE0C8;color:#92400E;';
  }

  private sortTrainNumber(a: string, b: string): number {
    const parse = (s: string) => {
      const m = s.match(/^([A-Za-z]+)(\d+)[-_]?(\d*)$/);
      if (!m) return { series: 0, unit: 0 };
      return { series: parseInt(m[2], 10), unit: parseInt(m[3] || '0', 10) };
    };
    const pa = parse(a);
    const pb = parse(b);
    if (pa.series !== pb.series) return pa.series - pb.series;
    return pa.unit - pb.unit;
  }

  exportCapoturnoShift(): void {
    if (!this.capoturnoSession) {
      return;
    }
    const shift = this.capoturnoShift;
    const orders = this.allWorkOrders
      .filter((order) => order.shift === shift)
      .sort((a, b) => this.sortTrainNumber(a.trainNumber, b.trainNumber));

    let lastTrainNumber: string | null = null;
    const rows = orders.flatMap((order) => {
      const needsSep = lastTrainNumber !== null && lastTrainNumber !== order.trainNumber;
      lastTrainNumber = order.trainNumber;
      const sep = needsSep
        ? `<tr><td colspan="8" style="border:none;padding:4px;"></td></tr>`
        : '';
      const odlRow = `
        <tr style="font-weight:bold;background:#f0f0f0;">
          <td>${this.escapeHtml(order.trainNumber)}</td>
          <td>${this.escapeHtml(order.codiceODL)}</td>
          <td>Stato ODL - ${this.escapeHtml(this.formatStatus(order.status))}</td>
          <td>Creato il ${this.escapeHtml(this.formatDateForExport(order.createdAt))}</td>
          <td></td>
          <td>Tipo lavorazione</td>
          <td>Stato Lavorazioni</td>
          <td>Tecnico</td>
        </tr>
      `;
      if (!order.tasks.length) {
        return [sep + odlRow];
      }
      const taskRows = order.tasks.map(
        (task) => `
          <tr>
            <td>${this.escapeHtml(task.description)}</td>
            <td></td>
            <td>${this.escapeHtml(this.formatStatus(order.status))}</td>
            <td></td>
            <td></td>
            <td>${this.escapeHtml(this.formatPriority(task.priority))}</td>
            <td style="${this.getTaskStatusStyle(task.status)}">${this.escapeHtml(this.formatStatus(task.status))}</td>
            <td>${this.escapeHtml(task.assignedTechnicianName)}</td>
          </tr>
        `,
      );
      return [sep + odlRow, ...taskRows];
    });

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #999; padding: 6px 8px; font-size: 12px; }
            th { background: #f0f0f0; text-align: left; }
            .meta td { border: none; padding: 4px 0; }
          </style>
        </head>
        <body>
          <table class="meta">
            <tr><td><strong>Capoturno:</strong> ${this.escapeHtml(this.capoturnoName)}</td></tr>
            <tr><td><strong>Matricola:</strong> ${this.escapeHtml(this.capoturnoSession.matricola)}</td></tr>
            <tr><td><strong>Turno:</strong> ${this.escapeHtml(shift)}</td></tr>
            <tr><td><strong>Esportato il:</strong> ${this.escapeHtml(this.formatDateForExport(new Date()))}</td></tr>
          </table>
          <br />
          <table>
            <tbody>
              ${rows.length ? rows.join('') : '<tr><td colspan="8">Nessun ordine nel turno selezionato</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const filename = `turno-${this.escapeFilename(this.capoturnoName)}-${this.formatDateForFilename(
      new Date(),
    )}.xls`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private formatDateForExport(date?: Date): string {
    if (!date) {
      return '';
    }
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(date));
  }

  private formatDateForFilename(date?: Date): string {
    if (!date) {
      return 'sconosciuta';
    }
    const formatted = this.formatDateForExport(date).replace(/[/: ]+/g, '-');
    return formatted.toLowerCase();
  }

  private formatPriority(priority: Task['priority']): string {
    if (priority === 'preventiva') return 'Preventiva';
    if (priority === 'correttiva') return 'Correttiva';
    return 'Urgente';
  }

  private formatStatus(status: Task['status'] | WorkOrder['status']): string {
    if (status === 'in_progress') return 'In corso';
    if (status === 'risolte') return 'Risolte';
    if (status === 'rimandato') return 'Rimandato';
    if (status === 'aperta') return 'Aperta';
    if (status === 'pending') return 'In attesa';
    if (status === 'active') return 'In corso';
    if (status === 'completed') return 'Completato';
    if (status === 'cancelled') return 'Annullato';
    return String(status);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeFilename(value: string): string {
    return value.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').toLowerCase();
  }

  logoutCapoturno(): void {
    this.profileDropdownOpen = false;
    this.capoturnoSessionService.clearSession();
    this.capoturnoNickname = '';
    this.capoturnoMatricola = '';
    this.capoturnoShift = this.capoturnoShiftOptions[0];
    this.capoturnoLoginState = { type: 'success', message: 'Logout completato.' };
    // Reset utenti section on logout
    this.utentiUnlocked = false;
    this.utentiPassword = '';
    this.utentiCurrentPassword = '';
    while (this.capoturniArray.length) this.capoturniArray.removeAt(0);
    while (this.tecniciArray.length) this.tecniciArray.removeAt(0);
  }

  ngOnDestroy(): void {
    this.workOrdersSub?.unsubscribe();
    this.selectedWorkOrderSub?.unsubscribe();
    this.themeSub?.unsubscribe();
  }
}
