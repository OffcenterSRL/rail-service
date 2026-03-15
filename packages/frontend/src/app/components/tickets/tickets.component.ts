import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tickets">
      <div class="tickets-hero">
        <div>
          <p class="hero-label">Assistenza tecnica</p>
          <h2>Miei Biglietti</h2>
          <p class="hero-text">Tieni traccia delle segnalazioni, crea nuovi ticket e assegna i tecnici.</p>
        </div>
        <button class="tickets-action">Nuovo ticket</button>
      </div>
      <div class="tickets-list">
        <p class="empty-message">Nessun biglietto trovato</p>
      </div>
    </div>
  `,
  styles: [
    `
      .tickets {
        display: flex;
        flex-direction: column;
        gap: 16px;
        height: 100%;
      }

      .tickets-hero {
        background: linear-gradient(150deg, rgba(255, 124, 45, 0.1), rgba(16, 20, 40, 0.8));
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 20px;
        padding: 24px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: var(--glass-shadow);
      }

      .hero-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }

      h2 {
        font-size: 26px;
        margin: 0;
        font-weight: 600;
      }

      .hero-text {
        color: var(--text-secondary);
        font-size: 13px;
        margin-top: 6px;
      }

      .tickets-action {
        background: linear-gradient(180deg, #7bc7ff, #4b6ef5);
        color: #02050c;
        border-radius: 999px;
        padding: 10px 20px;
        font-weight: 600;
        border: none;
        box-shadow: 0 12px 24px rgba(75, 110, 245, 0.35);
      }

      .tickets-list {
        flex: 1;
        background: rgba(12, 16, 30, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 18px;
        padding: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .empty-message {
        text-align: center;
        color: var(--text-secondary);
        font-size: 14px;
      }
    `,
  ],
})
export class TicketsComponent {}
