import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tickets">
      <h2>My Tickets</h2>
      <div class="tickets-list">
        <p class="empty-message">No tickets found</p>
      </div>
    </div>
  `,
  styles: [`
    .tickets {
      padding: 20px;
    }

    .tickets-list {
      margin-top: 20px;
    }

    .empty-message {
      text-align: center;
      color: #999;
      padding: 40px 20px;
    }
  `]
})
export class TicketsComponent {}
