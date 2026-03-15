import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="container">
      <header class="header">
        <h1>🚂 Rail Service</h1>
        <nav class="nav">
          <a routerLink="/" class="nav-link">Dashboard</a>
          <a routerLink="/tickets" class="nav-link">Tickets</a>
        </nav>
      </header>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
      border-bottom: 1px solid #ddd;
      margin-bottom: 30px;
    }

    .header h1 {
      margin: 0;
      font-size: 28px;
    }

    .nav {
      display: flex;
      gap: 20px;
    }

    .nav-link {
      text-decoration: none;
      color: #333;
      font-weight: 500;
      padding: 8px 12px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .nav-link:hover {
      background-color: #f0f0f0;
    }

    .main-content {
      min-height: calc(100vh - 120px);
    }
  `]
})
export class AppComponent {}
