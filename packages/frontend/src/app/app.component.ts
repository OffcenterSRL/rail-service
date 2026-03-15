import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WorkOrderListComponent } from './components/work-order-list/work-order-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, WorkOrderListComponent],
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
            <button class="btn-caporturno">Tecnico</button>
          </div>
        </div>
      </header>

      <section class="hero-strip">
        <div class="hero-copy">
          <p class="hero-label">Dashboard Operativa</p>
          <h1>ETR700-12 • Turno Mattina</h1>
          <p class="hero-subtitle">Aggiornamento automatico 06:14 · 4 tecnici connessi</p>
        </div>
        <div class="hero-metrics">
          <div class="metric-card">
            <span class="metric-value">18</span>
            <span class="metric-label">Interventi totali</span>
          </div>
          <div class="metric-card accent">
            <span class="metric-value">04</span>
            <span class="metric-label">Tecnici online</span>
          </div>
          <div class="metric-card">
            <span class="metric-value">12</span>
            <span class="metric-label">Turni completati</span>
          </div>
        </div>
      </section>

      <div class="main-layout">
        <aside class="sidebar">
          <div class="sidebar-content">
            <h2 class="sidebar-title">ORDINI DI LAVORO</h2>
            <app-work-order-list></app-work-order-list>
          </div>
        </aside>

        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        color: var(--text-primary);
      }

      .app-shell {
        display: flex;
        flex-direction: column;
        gap: 20px;
        height: 100%;
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
        padding: 24px 32px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24px;
        box-shadow: var(--glass-shadow);
        backdrop-filter: blur(15px);
      }

      .hero-copy {
        flex: 2;
      }

      .hero-label {
        font-size: 12px;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }

      .hero-copy h1 {
        font-size: 28px;
        margin-bottom: 6px;
      }

      .hero-subtitle {
        font-size: 13px;
        color: var(--text-secondary);
      }

      .hero-metrics {
        flex: 1;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .metric-card {
        background: rgba(255, 255, 255, 0.04);
        border-radius: 16px;
        padding: 16px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        min-width: 110px;
        display: flex;
        flex-direction: column;
        gap: 4px;
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

      .btn-caporturno {
        background-color: var(--accent-orange);
        color: #0f0c08;
        padding: 9px 20px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 13px;
        transition: background-color 0.2s ease, transform 0.2s ease;
        box-shadow: 0 12px 20px rgba(255, 124, 45, 0.25);
      }

      .btn-caporturno:hover {
        background-color: var(--accent-orange-soft);
        transform: translateY(-1px);
      }

      .main-layout {
        display: flex;
        flex: 1;
        gap: 20px;
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

      @media (max-width: 1024px) {
        .main-layout {
          flex-direction: column;
        }

        .sidebar {
          width: 100%;
        }
      }

      @media (max-width: 768px) {
        body {
          padding: 0 10px;
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
    `,
  ],
})
export class AppComponent {}
