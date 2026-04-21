import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { APP_VERSION } from './app-version';
import { AdminComponent } from './components/admin/admin.component';
import { FlottaToscanaPageComponent } from './components/flotta-toscana/flotta-toscana-page.component';
import { MaterialsRequestPageComponent } from './components/materials-request/materials-request-page.component';
import { WorkOrderListComponent } from './components/work-order-list/work-order-list.component';
import { AuthService, CapoturnoSession } from './services/auth.service';
import { CapoturnoSessionService } from './services/capoturno-session.service';
import { DashboardService, DashboardStats } from './services/dashboard.service';
import { Task, WorkOrder, WorkOrderService } from './services/work-order.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterOutlet,
    WorkOrderListComponent,
    AdminComponent,
    MaterialsRequestPageComponent,
    FlottaToscanaPageComponent,
  ],
  template: `
    <div class="app-shell">
      <header class="header">
        <div class="header-content">
          <div class="logo">
            <span class="logo-icon">🚂</span>
            <span class="logo-text">HMU SERVICE</span>
          </div>
          <div class="header-right">
            <div class="view-toggle">
              <button
                class="view-btn"
                [class.active]="viewMode === 'capoturno'"
                (click)="setView('capoturno')"
              >
                Capoturno
              </button>
              <button
                class="view-btn"
                [class.active]="viewMode === 'admin'"
                (click)="setView('admin')"
              >
                Admin
              </button>
            </div>
            <button
              *ngIf="viewMode === 'capoturno' && capoturnoSession"
              class="logout-btn"
              type="button"
              (click)="logoutCapoturno()"
            >
              Esci
            </button>
          </div>
        </div>
      </header>

      <section class="hero-strip" *ngIf="!(viewMode === 'capoturno' && !capoturnoSession)">
        <div class="hero-strip-top">
            <div class="hero-copy">
              <p class="hero-label">Dashboard Operativa</p>
              <h1>
              {{ capoturnoName }} • Turno {{ getShiftLabel(capoturnoShift) }}
              </h1>
              <button
                *ngIf="viewMode === 'capoturno' && capoturnoSession"
                class="hero-export"
                type="button"
                (click)="exportCapoturnoShift()"
              >
                Esporta turno
              </button>
              <p class="hero-subtitle">
                {{
                  viewMode === 'capoturno'
                  ? ''
                  : 'Admin view · aggiorna i tecnici e i parametri operativi'
                }}
              </p>
          </div>
          <div class="hero-metrics">
            <div class="metric-card">
              <span class="metric-value">{{ getOpenOrdersForShift().length }}</span>
              <span class="metric-label">Interventi totali</span>
            </div>
            <div class="metric-card">
              <span class="metric-value">{{ getOpenOrdersForShift().length }}</span>
              <span class="metric-label">ODL attivi</span>
            </div>
            <div class="metric-card">
              <span class="metric-value">{{
                dashboardStats.lastUpdated | date: 'shortTime'
              }}</span>
              <span class="metric-label">Ultimo aggiornamento</span>
            </div>
          </div>
        </div>
      </section>

      <div class="main-layout">
        <ng-container [ngSwitch]="viewMode">
          <ng-container *ngSwitchCase="'capoturno'">
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
              </ng-container>
            </ng-container>
            <ng-template #capoturnoLogin>
              <div class="tecnico-panel">
                <div class="panel-shell">
                  <div class="panel-heading">
                    <h2>Login Capoturno</h2>
                    <span class="panel-subtitle">
                      Accedi con nickname, matricola e turno per gestire gli ordini.
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
                  <div class="field">
                    <label>Turno</label>
                    <select [(ngModel)]="capoturnoShift">
                      <option *ngFor="let option of capoturnoShiftOptions" [value]="option">
                        {{ option }}
                      </option>
                    </select>
                  </div>
                  <button class="btn btn-primary" (click)="loginCapoturno()">
                    Accedi come capoturno
                  </button>
                </div>
              </div>
            </ng-template>
          </ng-container>

          <ng-container *ngSwitchCase="'admin'">
            <div class="admin-placeholder">
              <app-admin></app-admin>
            </div>
          </ng-container>
        </ng-container>
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

      .header {
        background: rgba(16, 18, 30, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 16px 28px;
        backdrop-filter: blur(14px);
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 20px;
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      .logo-icon {
        font-size: 28px;
      }

      .logo-text {
        color: var(--text-primary);
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .status-pill {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 6px 14px;
        border-radius: 999px;
        font-size: 13px;
        letter-spacing: 0.4px;
        text-transform: uppercase;
      }

      .hero-strip {
        background: #0b0f1d;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 18px 26px;
        display: flex;
        flex-direction: column;
        gap: 18px;
        backdrop-filter: blur(15px);
      }

      .hero-strip-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        flex-wrap: wrap;
      }

      .hero-copy {
        flex: 1 1 280px;
        min-height: 1px;
        min-width: 240px;
      }

      .hero-label {
        font-size: 12px;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }

      .hero-copy h1 {
        font-size: 24px;
        margin-bottom: 4px;
      }

      .hero-export {
        margin-top: 6px;
        padding: 10px 18px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.08);
        color: var(--text-primary);
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .hero-export:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
      }

      .hero-subtitle {
        font-size: 13px;
        color: var(--text-secondary);
      }

      .hero-metrics {
        flex: 1 1 320px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
        overflow: hidden;
      }

      .metric-card {
        background: rgba(255, 255, 255, 0.04);
        border-radius: 16px;
        padding: 12px 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        min-width: 90px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .metric-support {
        font-size: 11px;
        color: var(--text-muted);
      }

      .metric-card.accent {
        background: linear-gradient(180deg, #ff8e3a, #ff5d1e);
        color: #0b0b0b;
      }

      .metric-value {
        font-size: 26px;
        font-weight: 600;
      }

      .metric-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: inherit;
        opacity: 0.85;
      }

      .view-toggle {
        display: inline-flex;
        gap: 6px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.05);
        padding: 4px;
      }

      .view-btn {
        border: none;
        background: transparent;
        color: var(--text-secondary);
        padding: 6px 12px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        transition: all 0.2s ease;
      }

      .view-btn.active {
        background: rgba(255, 255, 255, 0.18);
        color: #fff;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.3);
      }

      .logout-btn {
        padding: 6px 14px;
        border-radius: 999px;
        border: 1px solid rgba(255, 77, 79, 0.5);
        background: rgba(255, 77, 79, 0.12);
        color: #ff6b6b;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      }

      .logout-btn:hover {
        transform: translateY(-1px);
        border-color: rgba(255, 77, 79, 0.8);
        box-shadow: 0 10px 18px rgba(255, 77, 79, 0.25);
      }

      .tecnico-login {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tecnico-panel {
        display: flex;
        align-items: stretch;
        justify-content: center;
        min-height: calc(100vh - 200px);
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

      .panel-shell .btn-tertiary {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: var(--text-primary);
      }

      .assigned-tasks {
        margin-top: 18px;
        border-top: 1px dashed rgba(255, 255, 255, 0.25);
        padding-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .assigned-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .assigned-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .assigned-task {
        background: rgba(255, 255, 255, 0.04);
        border-radius: 14px;
        padding: 12px 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        flex-direction: column;
        gap: 6px;
        cursor: pointer;
        transition: border-color 0.2s ease, transform 0.2s ease;
      }

      .assigned-task.active {
        border-color: rgba(123, 199, 255, 0.6);
        box-shadow: 0 12px 24px rgba(75, 110, 245, 0.2);
        transform: translateY(-1px);
      }

      .assigned-task-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }

      .task-order {
        font-size: 13px;
        letter-spacing: 0.5px;
        color: var(--text-secondary);
      }

      .task-status-pill {
        font-size: 11px;
        background: rgba(124, 199, 255, 0.2);
        color: var(--text-primary);
        padding: 4px 10px;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .task-compile-card {
        margin-top: 16px;
        background: rgba(15, 18, 32, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .compile-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        color: var(--text-secondary);
        font-size: 12px;
      }

      .status-pill {
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        font-weight: 600;
        color: var(--text-primary);
      }

      .status-pill.aperta {
        background: rgba(255, 124, 45, 0.18);
        color: #ff9d5c;
      }

      .status-pill.in_progress {
        background: rgba(124, 199, 255, 0.16);
        color: #7bc7ff;
      }

      .status-pill.risolte {
        background: rgba(130, 255, 169, 0.16);
        color: #82ffa9;
      }

      .compile-header h4 {
        margin: 0;
        color: var(--text-primary);
        font-size: 16px;
      }

      .compile-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 12px;
        color: var(--text-secondary);
      }

      .compile-field input {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        color: var(--text-primary);
        padding: 10px 12px;
      }

      .compile-time {
        display: flex;
        gap: 10px;
      }

      .compile-time select {
        flex: 1;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        color: var(--text-primary);
        padding: 10px 12px;
      }

      .compile-technicians {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .compile-tech-row {
        display: grid;
        grid-template-columns: minmax(200px, 1fr) minmax(140px, 1fr) auto;
        gap: 10px;
        align-items: center;
      }

      .compile-tech-row select {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        color: var(--text-primary);
        padding: 8px 10px;
      }

      .tech-matricola {
        font-size: 12px;
        color: var(--text-secondary);
      }

      .compile-actions {
        display: flex;
        justify-content: flex-end;
      }

      .task-description {
        font-size: 14px;
        color: var(--text-primary);
        margin: 0;
      }

      .task-priority {
        font-size: 11px;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        color: #fff;
        padding: 2px 10px;
        border-radius: 999px;
        align-self: flex-start;
      }

      .task-priority.preventiva {
        background: rgba(90, 176, 255, 0.7);
      }

      .task-priority.correttiva {
        background: rgba(255, 144, 65, 0.7);
      }

      .task-priority.urgente {
        background: rgba(255, 77, 79, 0.8);
      }

      .task-empty {
        border: 1px dashed rgba(255, 255, 255, 0.3);
        border-radius: 14px;
        padding: 12px 14px;
        color: var(--text-secondary);
        font-size: 13px;
      }

      .assigned-controls input {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: var(--text-primary);
        border-radius: 10px;
        padding: 8px 12px;
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

      .admin-placeholder {
        width: 100%;
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
        body {
          padding: 0 16px;
        }

        .hero-strip {
          flex-direction: column;
          align-items: flex-start;
        }

        .hero-metrics {
          justify-content: flex-start;
        }

        .main-content {
          padding: 24px;
        }
      }

      @media (max-width: 768px) {
        body {
          padding: 0 10px;
        }

        .hero-strip {
          padding: 16px;
        }

        .header {
          padding: 12px 18px;
        }

        .hero-copy h1 {
          font-size: 22px;
        }

        .hero-metrics {
          justify-content: flex-start;
        }

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
        .header-content {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .header-right {
          width: 100%;
          flex-wrap: wrap;
          gap: 8px;
        }

        .header .status-pill {
          display: none;
        }

        .view-toggle {
          flex: 1;
        }

        .view-btn {
          flex: 1;
          padding: 6px 6px;
          font-size: 11px;
        }

        .logout-btn {
          margin-left: auto;
        }

        .hero-strip {
          flex-direction: column;
          min-height: auto;
        }

        .hero-copy h1 {
          font-size: 19px;
        }

        .hero-metrics {
          width: 100%;
          justify-content: space-between;
        }

        .metric-card {
          flex: 1;
          min-width: 0;
        }

        .metric-value {
          font-size: 20px;
        }

        .main-layout {
          gap: 10px;
        }

        .sidebar {
          padding: 10px 0;
          border-radius: 16px;
        }

        .main-content {
          border-radius: 16px;
          padding: 14px;
        }

        .panel-shell {
          padding: 16px 14px;
          gap: 14px;
          border-radius: 20px;
        }

        .panel-shell .btn {
          width: 100%;
          text-align: center;
        }

        .panel-heading h2 {
          font-size: 22px;
        }

        .tecnico-panel {
          padding: 0;
          min-height: auto;
        }

        .compile-tech-row {
          grid-template-columns: 1fr;
        }

        .task-compile-card {
          padding: 14px;
        }

        .login-card {
          padding: 20px;
        }

        .app-footer {
          text-align: center;
        }
      }

      @media (max-width: 420px) {
        body {
          padding: 0 6px;
        }

        .header {
          padding: 10px 14px;
          border-radius: 14px;
        }

        .logo {
          font-size: 17px;
        }

        .logo-icon {
          font-size: 22px;
        }

        .hero-copy h1 {
          font-size: 17px;
        }

        .hero-strip {
          padding: 14px;
          border-radius: 16px;
        }

        .metric-value {
          font-size: 18px;
        }

        .sidebar-content {
          padding: 10px 14px;
        }
      }
    `,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  viewMode: 'capoturno' | 'admin' = 'capoturno';
  capoturnoSection: 'ordini' | 'materiali' | 'ti' | 'scadenze' | 'flotta' = 'ordini';
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
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private capoturnoSessionService = inject(CapoturnoSessionService);
  private workOrderService = inject(WorkOrderService);
  private router = inject(Router);
  private workOrdersSub?: Subscription;
  private selectedWorkOrderSub?: Subscription;
  private readonly viewModeStorageKey = 'rail-service.view-mode';

  setView(mode: 'capoturno' | 'admin'): void {
    this.applyViewMode(mode);
  }

  setCapoturnoSection(section: 'ordini' | 'materiali' | 'ti' | 'scadenze' | 'flotta'): void {
    this.capoturnoSection = section;
  }

  private applyViewMode(
    mode: 'capoturno' | 'admin',
    options?: { persist?: boolean; skipRouter?: boolean },
  ): void {
    this.viewMode = mode;
    if (options?.persist !== false) {
      this.persistViewMode(mode);
    }
    if (options?.skipRouter !== true && mode !== 'admin') {
      this.router.navigateByUrl('/');
    }
  }

  loginCapoturno(): void {
    if (!this.capoturnoNickname || !this.capoturnoMatricola || !this.capoturnoShift) {
      this.capoturnoLoginState = {
        type: 'error',
        message: 'Inserisci nickname, matricola e turno per accedere.',
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
          this.capoturnoSessionService.setSession({
            ...session,
            shift: this.capoturnoShift,
          });
          this.capoturnoLoginState = { type: 'success', message: session.message };
        },
        error: (error) => {
          const message = error?.error?.error ?? 'Errore durante il login capoturno.';
          this.capoturnoLoginState = { type: 'error', message };
        },
      });
  }

  ngOnInit(): void {
    this.restoreViewMode();
    this.loadDashboardStats();
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
    this.capoturnoSessionService.clearSession();
    this.capoturnoNickname = '';
    this.capoturnoMatricola = '';
    this.capoturnoShift = this.capoturnoShiftOptions[0];
    this.capoturnoLoginState = { type: 'success', message: 'Logout completato.' };
  }

  private restoreViewMode(): void {
    const stored = this.readStoredViewMode();
    if (!stored) {
      return;
    }
    this.applyViewMode(stored, { persist: false, skipRouter: true });
  }

  private persistViewMode(mode: 'capoturno' | 'admin'): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(this.viewModeStorageKey, mode);
  }

  private readStoredViewMode(): 'capoturno' | 'admin' | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const stored = window.localStorage.getItem(this.viewModeStorageKey);
    if (stored === 'capoturno' || stored === 'admin') {
      return stored;
    }
    return null;
  }

  ngOnDestroy(): void {
    this.workOrdersSub?.unsubscribe();
    this.selectedWorkOrderSub?.unsubscribe();
  }
}
