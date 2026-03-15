import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h2>Dashboard</h2>
      <div class="stats">
        <div class="stat-card">
          <h3>Total Tickets</h3>
          <p class="stat-value">0</p>
        </div>
        <div class="stat-card">
          <h3>Active Bookings</h3>
          <p class="stat-value">0</p>
        </div>
        <div class="stat-card">
          <h3>Upcoming Trips</h3>
          <p class="stat-value">0</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 20px;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .stat-card {
      padding: 20px;
      background: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 8px;
    }

    .stat-card h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #666;
    }

    .stat-value {
      margin: 0;
      font-size: 32px;
      font-weight: bold;
      color: #333;
    }
  `]
})
export class DashboardComponent {}
