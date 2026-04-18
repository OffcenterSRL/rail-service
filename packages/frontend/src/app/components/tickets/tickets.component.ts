import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TicketRecord, TicketService } from '../../services/ticket.service';

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
          <p class="hero-text">
            Tieni traccia delle prenotazioni, crea nuovi ticket e monitora lo stato dei passeggeri.
          </p>
        </div>
        <button class="tickets-action" (click)="createTicket()" [disabled]="creatingTicket">
          {{ creatingTicket ? 'Creazione in corso...' : 'Nuovo ticket' }}
        </button>
      </div>
      <div class="tickets-list">
        <p *ngIf="actionMessage" class="tickets-feedback">{{ actionMessage }}</p>

        <div *ngIf="loading" class="tickets-loading">Caricamento in corso…</div>

        <div *ngIf="!loading && tickets.length" class="ticket-grid">
          <article *ngFor="let ticket of tickets" class="ticket-card">
            <div class="ticket-row">
              <span class="ticket-train">{{ ticket.trainNumber }}</span>
              <span class="ticket-status" [ngClass]="ticket.status">
                {{ ticket.status | titlecase }}
              </span>
            </div>
            <p class="ticket-route">{{ ticket.codiceODL }}</p>
            <p class="ticket-time">{{ ticket.shift }}</p>
            <div class="ticket-meta">
              <span>{{ ticket.tasks.length }} task</span>
            </div>
            <div class="ticket-actions">
              <button
                class="btn btn-ghost"
                (click)="cancelTicket(ticket)"
                [disabled]="ticket.status !== 'active' || cancelingTicketId === ticket._id"
              >
                {{ cancelingTicketId === ticket._id ? 'Annullamento…' : 'Annulla' }}
              </button>
            </div>
          </article>
        </div>

        <p *ngIf="!loading && !tickets.length" class="empty-message">Nessun biglietto trovato</p>
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
        max-width: 320px;
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
        flex-direction: column;
        gap: 16px;
      }

      .tickets-feedback {
        font-size: 12px;
        color: var(--accent-lime);
        margin: 0;
      }

      .tickets-loading {
        text-align: center;
        color: var(--text-secondary);
      }

      .ticket-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 12px;
      }

      .ticket-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
      }

      .ticket-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .ticket-train {
        font-weight: 600;
        font-size: 16px;
      }

      .ticket-status {
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 500;
        background: rgba(124, 199, 255, 0.12);
        color: var(--accent-blue);
      }

      .ticket-status.used {
        background: rgba(130, 255, 169, 0.12);
        color: var(--accent-lime);
      }

      .ticket-status.cancelled {
        background: rgba(255, 124, 45, 0.12);
        color: var(--accent-orange);
      }

      .ticket-route {
        font-size: 14px;
        color: var(--text-secondary);
        margin: 0;
      }

      .ticket-time {
        font-size: 12px;
        color: var(--text-muted);
        margin: 0;
      }

      .ticket-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: var(--text-secondary);
      }

      .ticket-actions {
        display: flex;
        justify-content: flex-end;
      }

      .btn-ghost {
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: transparent;
        color: var(--text-primary);
        border-radius: 999px;
        padding: 6px 16px;
        font-size: 12px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      .btn-ghost:hover:not(:disabled) {
        transform: translateY(-1px);
        border-color: rgba(255, 255, 255, 0.4);
      }

      .btn-ghost:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .empty-message {
        text-align: center;
        color: var(--text-secondary);
        font-size: 14px;
        margin: 0;
      }

      @media (max-width: 768px) {
        .ticket-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 600px) {
        .tickets-hero {
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
          padding: 18px;
        }

        .tickets-action {
          width: 100%;
        }

        .tickets-list {
          padding: 16px;
        }

        .ticket-meta {
          flex-direction: column;
          gap: 6px;
        }

        .ticket-actions {
          justify-content: stretch;
        }

        .btn-ghost {
          width: 100%;
        }
      }
    `,
  ],
})
export class TicketsComponent implements OnInit {
  tickets: TicketRecord[] = [];
  loading = false;
  creatingTicket = false;
  cancelingTicketId: string | null = null;
  actionMessage = '';

  constructor(private ticketService: TicketService) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  createTicket(): void {
    this.creatingTicket = true;
    this.actionMessage = '';
    const payload = {
      trainNumber: 'ETR700-12',
      shift: 'Turno in corso',
    };

    this.ticketService.bookTicket(payload).subscribe({
      next: () => {
        this.creatingTicket = false;
        this.actionMessage = 'Biglietto creato con successo.';
        this.loadTickets();
      },
      error: () => {
        this.creatingTicket = false;
        this.actionMessage = 'Errore durante la creazione del biglietto.';
      },
    });
  }

  cancelTicket(ticket: TicketRecord): void {
    this.cancelingTicketId = ticket._id;
    this.actionMessage = '';

    this.ticketService.cancelTicket(ticket._id).subscribe({
      next: () => {
        this.cancelingTicketId = null;
        this.actionMessage = `Ordine ${ticket.trainNumber} annullato.`;
        this.loadTickets();
      },
      error: () => {
        this.cancelingTicketId = null;
        this.actionMessage = 'Impossibile annullare il biglietto.';
      },
    });
  }

  private loadTickets(): void {
    this.loading = true;
    this.ticketService.getTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.loading = false;
      },
      error: () => {
        this.tickets = [];
        this.loading = false;
      },
    });
  }
}
