import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { WorkOrderListComponent } from './components/work-order-list/work-order-list.component';
import { AdminComponent } from './components/admin/admin.component';
import { APP_VERSION } from './app-version';
import { HttpClientModule } from '@angular/common/http';
import { DashboardService, DashboardStats } from './services/dashboard.service';
import { AuthService, TechnicianSession } from './services/auth.service';
import { Task, WorkOrder, WorkOrderService } from './services/work-order.service';
import { Subscription } from 'rxjs';

type AssignedTask = {
  description: string;
  priority: Task['priority'];
  status: Task['status'];
  orderCode: string;
  trainNumber: string;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterOutlet, WorkOrderListComponent, AdminComponent],
  template: `
    <div class="app-shell">
      <header class="header">
        <div class="header-content">
          <div class="logo">
            <span class="logo-icon">🚂</span>
            <span class="logo-text">HMU SERVICE</span>
          </div>
          <div class="header-right">
            <div class="status-pill">3 ordini attivi</div>
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
                [class.active]="viewMode === 'tecnico'"
                (click)="setView('tecnico')"
              >
                Tecnico
              </button>
              <button
                class="view-btn"
                [class.active]="viewMode === 'admin'"
                (click)="setView('admin')"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </header>

      <section class="hero-strip" *ngIf="viewMode !== 'tecnico'">
        <div class="hero-strip-top">
          <div class="hero-copy">
            <p class="hero-label">Dashboard Operativa</p>
            <h1>ETR700-12 • Turno Mattina</h1>
              <p class="hero-subtitle">
                {{
                  viewMode === 'capoturno'
                    ? 'Turno attivo · monitora gli ordini e i tecnici assegnati'
                    : 'Admin view · aggiorna i tecnici e i parametri operativi'
                }}
              </p>
          </div>
          <div class="hero-metrics">
            <div class="metric-card">
              <span class="metric-value">{{ dashboardStats.interventions }}</span>
              <span class="metric-label">Interventi totali</span>
            </div>
            <div class="metric-card">
              <span class="metric-value">{{ dashboardStats.shiftsCompleted }}</span>
              <span class="metric-label">Turni completati</span>
            </div>
            <div class="metric-card">
              <span class="metric-value">{{ dashboardStats.activeTickets }}</span>
              <span class="metric-label">ODL attivi</span>
            </div>
            <div class="metric-card">
              <span class="metric-value">{{ dashboardStats.cancelledTickets }}</span>
              <span class="metric-label">ODL cancellati</span>
            </div>
            <div class="metric-card">
              <span class="metric-value">{{ dashboardStats.lastUpdated | date: 'shortTime' }}</span>
              <span class="metric-label">Ultimo aggiornamento</span>
            </div>
          </div>
        </div>
      </section>

      <div class="main-layout">
        <ng-container [ngSwitch]="viewMode">
          <ng-container *ngSwitchCase="'capoturno'">
            <aside class="sidebar">
              <div class="sidebar-content">
                <h2 class="sidebar-title">ORDINI DI LAVORO</h2>
                <app-work-order-list></app-work-order-list>
              </div>
            </aside>
            <main class="main-content">
              <router-outlet></router-outlet>
            </main>
          </ng-container>

          <ng-container *ngSwitchCase="'tecnico'">
            <div class="tecnico-panel">
              <div class="panel-shell">
                <div class="panel-heading">
                  <h2>Login Tecnico</h2>
                  <span class="panel-subtitle">Accedi con nickname e matricola per vedere le tue lavorazioni.</span>
                </div>
                <p
                  *ngIf="loginState"
                  class="login-message"
                  [class.success]="loginState.type === 'success'"
                  [class.error]="loginState.type === 'error'"
                >
                  {{ loginState.message }}
                </p>
                <ng-container *ngIf="!technicianSession">
                  <div class="field">
                    <label>Nickname</label>
                    <input type="text" [(ngModel)]="tecNickname" placeholder="es. Carlo" />
                  </div>
                  <div class="field">
                    <label>Matricola</label>
                    <input type="text" [(ngModel)]="tecMatricola" placeholder="123456" />
                  </div>
                  <button class="btn btn-primary" (click)="loginTechnician()">Accedi come tecnico</button>
                </ng-container>
              <div *ngIf="technicianSession" class="assigned-tasks">
                  <div class="assigned-header">
                    <h3>Lavorazioni per {{ technicianSession.nickname }}</h3>
                    <div class="assigned-actions">
                      <button type="button" class="btn btn-secondary" (click)="toggleShowCompletedOrders()">
                        {{ showCompletedOrders ? 'Nascondi ODL completati' : 'Mostra ODL completati' }}
                      </button>
                      <button type="button" class="btn btn-tertiary" (click)="logoutTechnician()">Esci</button>
                    </div>
                  </div>
                  <div class="assigned-controls">
                    <input
                      type="search"
                      [(ngModel)]="searchTerm"
                      (ngModelChange)="updateSearchTerm($event)"
                      placeholder="Cerca lavorazioni, treno o codice"
                    />
                  </div>
                  <div *ngIf="assignedTasks.length === 0" class="task-empty">
                    <p>Nessuna lavorazione assegnata per il momento.</p>
                  </div>
                  <div *ngFor="let item of assignedTasks" class="assigned-task">
                    <div class="assigned-task-header">
                      <span class="task-order">{{ item.orderCode }} · {{ item.trainNumber }}</span>
                      <span class="task-status-pill">{{ item.status | uppercase }}</span>
                    </div>
                    <p class="task-description">{{ item.description }}</p>
                    <span class="task-priority" [ngClass]="item.priority">{{ item.priority | titlecase }}</span>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

          <ng-container *ngSwitchCase="'admin'">
            <div class="admin-placeholder">
              <app-admin></app-admin>
            </div>
          </ng-container>
        </ng-container>
      </div>
      <footer class="app-footer">
        Versione {{ appVersion }}
      </footer>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        color: var(--text-primary);
        background: radial-gradient(circle at top, rgba(124, 199, 255, 0.2), rgba(9, 13, 26, 0.95) 45%);
        background-attachment: fixed;
      }

      .app-shell {
        display: flex;
        flex-direction: column;
        gap: 20px;
        min-height: 100vh;
        padding: 20px 0;
        width: 100%;
        box-sizing: border-box;
      }

      .header {
        background: rgba(16, 18, 30, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 16px 28px;
        box-shadow: var(--glass-shadow);
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
        background: linear-gradient(135deg, rgba(9, 12, 25, 0.95), rgba(28, 34, 59, 0.95));
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 18px 26px;
        display: flex;
        flex-direction: column;
        gap: 18px;
        box-shadow: var(--glass-shadow);
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
        box-shadow: 0 30px 75px rgba(2, 6, 18, 0.7);
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
        transition: transform 0.2s ease, box-shadow 0.2s ease;
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
      }

      @media (max-width: 600px) {
        .header-content {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .status-pill {
          font-size: 11px;
          padding: 4px 10px;
        }

        .hero-strip {
          flex-direction: column;
          min-height: auto;
        }

        .hero-metrics {
          width: 100%;
          justify-content: space-between;
        }

        .metric-card {
          flex: 1;
          min-width: 0;
        }

        .main-content {
          padding: 16px;
        }

        .login-card {
          padding: 20px;
        }
      }
    `,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  viewMode: 'capoturno' | 'tecnico' | 'admin' = 'capoturno';
  tecNickname = '';
  tecMatricola = '';
  loginState: { type: 'success' | 'error'; message: string } | null = null;
  technicianSession: TechnicianSession | null = null;
  assignedTasks: AssignedTask[] = [];
  searchTerm = '';
  showCompletedOrders = false;
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
  private workOrderService = inject(WorkOrderService);
  private router = inject(Router);
  private assignedTasksSub?: Subscription;
  private workOrdersSnapshot: WorkOrder[] = [];
  private readonly technicianStorageKey = 'rail-service.tech-session';
  private readonly viewModeStorageKey = 'rail-service.view-mode';

  setView(mode: 'capoturno' | 'tecnico' | 'admin'): void {
    this.applyViewMode(mode);
  }

  private applyViewMode(
    mode: 'capoturno' | 'tecnico' | 'admin',
    options?: { persist?: boolean; skipRouter?: boolean },
  ): void {
    this.viewMode = mode;
    this.loginState = null;
    if (mode !== 'tecnico') {
      this.clearTechnicianSession();
    }
    if (options?.persist !== false) {
      this.persistViewMode(mode);
    }
    if (options?.skipRouter !== true && mode !== 'admin') {
      this.router.navigateByUrl('/');
    }
  }

  private clearTechnicianSession(): void {
    this.assignedTasksSub?.unsubscribe();
    this.assignedTasksSub = undefined;
    this.assignedTasks = [];
    this.technicianSession = null;
  }

  toggleShowCompletedOrders(): void {
    this.showCompletedOrders = !this.showCompletedOrders;
    if (this.technicianSession) {
      this.updateAssignedTasksView(this.technicianSession.nickname.toLowerCase());
    }
  }

  updateSearchTerm(term: string): void {
    this.searchTerm = term;
    if (this.technicianSession) {
      this.updateAssignedTasksView(this.technicianSession.nickname.toLowerCase());
    }
  }

  loginTechnician(): void {
    if (!this.tecNickname || !this.tecMatricola) {
      this.loginState = { type: 'error', message: 'Inserisci nickname e matricola per accedere.' };
      return;
    }

    this.authService
      .loginTechnician({
        nickname: this.tecNickname,
        matricola: this.tecMatricola,
      })
      .subscribe({
        next: (session) => {
          this.technicianSession = session;
          this.loginState = { type: 'success', message: session.message };
          this.assignedTasksSub?.unsubscribe();
          this.watchAssignedTasks(session.nickname);
          this.persistTechnicianSession(session);
          this.searchTerm = '';
          this.showCompletedOrders = false;
        },
        error: (error) => {
          const message = error?.error?.error ?? 'Errore durante il login tecnico.';
          this.loginState = { type: 'error', message };
        },
      });
  }

  ngOnInit(): void {
    this.restoreViewMode();
    this.loadDashboardStats();
    this.restoreTechnicianSession();
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

  private watchAssignedTasks(nickname: string | null): void {
    this.assignedTasksSub?.unsubscribe();
    if (!nickname) {
      this.assignedTasks = [];
      return;
    }
    const normalized = nickname.toLowerCase();
    this.assignedTasksSub = this.workOrderService.getWorkOrders().subscribe((orders) => {
      this.workOrdersSnapshot = orders;
      this.updateAssignedTasksView(normalized);
    });
  }

  logoutTechnician(): void {
    this.clearStoredTechnicianSession();
    this.clearTechnicianSession();
    this.tecNickname = '';
    this.tecMatricola = '';
    this.searchTerm = '';
    this.showCompletedOrders = false;
    this.loginState = { type: 'success', message: 'Logout completato.' };
  }

  private updateAssignedTasksView(normalized: string): void {
    let tasks = this.workOrdersSnapshot.flatMap((order) =>
      order.tasks
        .filter((task: Task) => {
          const nicknameMatch = task.assignedTechnicianNickname?.toLowerCase() === normalized;
          const nameMatch = task.assignedTechnicianName?.toLowerCase() === normalized;
          const includeOrder = this.showCompletedOrders || order.status !== 'completed';
          return includeOrder && (nicknameMatch || nameMatch);
        })
        .map((task: Task) => ({
            description: task.description,
            priority: task.priority,
            status: task.status,
            orderCode: order.codiceODL,
            trainNumber: order.trainNumber,
        })),
    );
    const search = this.searchTerm.trim().toLowerCase();
    if (search) {
      tasks = tasks.filter(
        (item) =>
          item.description.toLowerCase().includes(search) ||
          item.orderCode.toLowerCase().includes(search) ||
          item.trainNumber.toLowerCase().includes(search),
      );
    }
    this.assignedTasks = tasks;
  }

  private restoreTechnicianSession(): void {
    const session = this.readStoredTechnicianSession();
    if (!session) {
      return;
    }
    this.technicianSession = session;
    this.tecNickname = session.nickname;
    this.tecMatricola = session.matricola;
    this.loginState = { type: 'success', message: session.message ?? 'Sessione ripristinata.' };
    this.searchTerm = '';
    this.showCompletedOrders = false;
    this.watchAssignedTasks(session.nickname);
  }

  private persistTechnicianSession(session: TechnicianSession): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(this.technicianStorageKey, JSON.stringify(session));
    } catch {
      // ignore
    }
  }

  private readStoredTechnicianSession(): TechnicianSession | null {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      const raw = window.localStorage.getItem(this.technicianStorageKey);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as TechnicianSession;
    } catch {
      return null;
    }
  }

  private clearStoredTechnicianSession(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem(this.technicianStorageKey);
  }

  private restoreViewMode(): void {
    const stored = this.readStoredViewMode();
    if (!stored) {
      return;
    }
    this.applyViewMode(stored, { persist: false, skipRouter: true });
  }

  private persistViewMode(mode: 'capoturno' | 'tecnico' | 'admin'): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(this.viewModeStorageKey, mode);
  }

  private readStoredViewMode(): 'capoturno' | 'tecnico' | 'admin' | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const stored = window.localStorage.getItem(this.viewModeStorageKey);
    if (stored === 'capoturno' || stored === 'tecnico' || stored === 'admin') {
      return stored;
    }
    return null;
  }

  ngOnDestroy(): void {
    this.assignedTasksSub?.unsubscribe();
  }
}
