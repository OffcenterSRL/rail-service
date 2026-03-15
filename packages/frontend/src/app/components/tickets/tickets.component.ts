import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tickets">
      <h2>Miei Biglietti</h2>
      <div class="tickets-list">
        <p class="empty-message">Nessun biglietto trovato</p>
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
      color: var(--text-secondary);
      padding: 40px 20px;
      font-size: 14px;
    }

    h2 {
      font-size: 24px;
      margin: 0 0 16px 0;
      font-weight: 600;
    }
  `]
})
export class TicketsComponent {}
