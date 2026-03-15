import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { WorkOrderListComponent } from './components/work-order-list/work-order-list.component';
import { APP_VERSION } from './app-version';
import { HttpClientModule } from '@angular/common/http';
import { DashboardService, DashboardStats } from './services/dashboard.service';
import { AuthService } from './services/auth.service';
import { TechnicianPresenceService } from './services/technician-presence.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterOutlet, WorkOrderListComponent],
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
            </div>
          </div>
        </div>
      </header>

      <section class="hero-strip">
        <div class="hero-strip-top">
          <div class="hero-copy">
            <p class="hero-label">Dashboard Operativa</p>
            <h1>ETR700-12 • Turno Mattina</h1>
            <p class="hero-subtitle">
              {{ viewMode === 'capoturno'
                ? 'Aggiornamento automatico 06:14 · 4 tecnici connessi'
                : 'Tecnico collegato · inserisci credenziali per accedere' }}
            </p>
          </div>
          <div class="hero-metrics">
            <div class="metric-card">
              <span class="metric-value">{{ dashboardStats.interventions }}</span>
              <span class="metric-label">Interventi totali</span>
            </div>
            <div class="metric-card accent">
              <ng-container *ngIf="technicianSnapshot$ | async as techSnapshot; else fallbackTech">
                <span class="metric-value">{{ techSnapshot.techniciansOnline }}</span>
                <span class="metric-label">Tecnici online (live)</span>
                <span class="metric-support">
                  {{ techSnapshot.active.length }} attivi · {{ techSnapshot.updatedAt | date: 'shortTime' }}
                </span>
              </ng-container>
              <ng-template #fallbackTech>
                <span class="metric-value">{{ dashboardStats.techniciansOnline }}</span>
                <span class="metric-label">Tecnici online (stima)</span>
                <span class="metric-support">Aggiornamento iniziale in corso</span>
              </ng-template>
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
        <ng-container *ngIf="viewMode === 'capoturno'; else tecnicoView">
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
        <ng-template #tecnicoView>
          <div class="tecnico-login">
            <div class="login-card">
              <h2>Login Tecnico</h2>
              <p>Inserisci il codice ODL, il tuo nome e la matricola per accedere.</p>
              <div class="field">
                <label>Codice ODL</label>
                <input type="text" [(ngModel)]="tecOdL" placeholder="ODL-XXXXXX" />
              </div>
              <div class="field">
                <label>Nome e cognome</label>
                <input type="text" [(ngModel)]="tecName" placeholder="Esempio: Mario Rossi" />
              </div>
              <div class="field">
                <label>Matricola</label>
                <input type="text" [(ngModel)]="tecMatricola" placeholder="123456" />
              </div>
              <button class="btn btn-primary" (click)="loginTechnician()">
                Accedi come tecnico
              </button>
              <p
                *ngIf="loginState"
                class="login-message"
                [class.success]="loginState.type === 'success'"
                [class.error]="loginState.type === 'error'"
              >
                {{ loginState.message }}
              </p>
            </div>
          </div>
        </ng-template>
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
      }

      .app-shell {
        display: flex;
        flex-direction: column;
        gap: 20px;
        min-height: 100vh;
        padding: 20px 0;
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

      .login-card {
        background: rgba(16, 19, 32, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 28px;
        width: min(420px, 100%);
        box-shadow: var(--glass-shadow);
        text-align: left;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .login-card h2 {
        margin: 0;
        font-size: 22px;
      }

      .login-card .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .login-card label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--text-secondary);
      }

      .login-card input {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.2);
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

      .login-card .btn {
        width: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 12px 0;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        border: none;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .login-card .btn-primary {
        background: linear-gradient(180deg, #7bc7ff, #4b6ef5);
        color: #02050c;
        box-shadow: 0 10px 20px rgba(75, 110, 245, 0.35);
      }

      .login-card .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 24px rgba(75, 110, 245, 0.45);
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
export class AppComponent implements OnInit {
  viewMode: 'capoturno' | 'tecnico' = 'capoturno';
  tecOdL = '';
  tecName = '';
  tecMatricola = '';
  loginState: { type: 'success' | 'error'; message: string } | null = null;
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
  private technicianPresenceService = inject(TechnicianPresenceService);
  technicianSnapshot$ = this.technicianPresenceService.snapshot$.asObservable();

  setView(mode: 'capoturno' | 'tecnico'): void {
    this.viewMode = mode;
    this.loginState = null;
  }

  loginTechnician(): void {
    if (!this.tecOdL || !this.tecName || !this.tecMatricola) {
      this.loginState = { type: 'error', message: 'Compila tutti i campi per accedere.' };
      return;
    }

    this.authService
      .loginTechnician({
        code: this.tecOdL,
        name: this.tecName,
        matricola: this.tecMatricola,
      })
      .subscribe({
        next: (session) => {
          this.loginState = { type: 'success', message: session.message };
        },
        error: (error) => {
          const message = error?.error?.error ?? 'Errore durante il login tecnico.';
          this.loginState = { type: 'error', message };
        },
      });
  }

  ngOnInit(): void {
    this.loadDashboardStats();
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
}
