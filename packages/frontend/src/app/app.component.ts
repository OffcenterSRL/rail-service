import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="app-container">
      <header class="header">
        <div class="header-content">
          <div class="logo">
            <span class="logo-icon">🚂</span>
            <span class="logo-text">HMU SERVICE</span>
          </div>
          <button class="btn-caporturno">Caporturno</button>
        </div>
      </header>

      <div class="main-layout">
        <aside class="sidebar">
          <div class="sidebar-content">
            <h2 class="sidebar-title">ORDINI DI LAVORO</h2>
            <div class="work-order-list" id="workOrderList">
              <!-- Work orders will be populated here -->
              <p class="placeholder">Nessun ordine</p>
            </div>
          </div>
        </aside>

        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      background-color: var(--dark-bg);
      color: var(--text-primary);
    }

    .app-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .header {
      background-color: var(--dark-secondary);
      border-bottom: 1px solid var(--dark-tertiary);
      padding: 0 24px;
      height: 64px;
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .logo-icon {
      font-size: 24px;
    }

    .logo-text {
      color: var(--text-primary);
    }

    .btn-caporturno {
      background-color: var(--accent-orange);
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 500;
      font-size: 14px;
      transition: background-color 0.2s;

      &:hover {
        background-color: var(--accent-orange-dark);
      }
    }

    .main-layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .sidebar {
      width: 280px;
      background-color: var(--dark-secondary);
      border-right: 1px solid var(--dark-tertiary);
      overflow-y: auto;
      flex-shrink: 0;
    }

    .sidebar-content {
      padding: 20px;
    }

    .sidebar-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-secondary);
      margin-bottom: 16px;
    }

    .work-order-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .placeholder {
      color: var(--text-secondary);
      font-size: 14px;
      text-align: center;
      padding: 20px 10px;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 200px;
      }

      .main-content {
        padding: 16px;
      }
    }
  `]
})
export class AppComponent {}
