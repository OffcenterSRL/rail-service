import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { WorkOrder, WorkOrderService } from '../../services/work-order.service';

const FLEET: string[] = [
  ...Array.from({ length: 10 }, (_, i) => `HTR312-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 10 }, (_, i) => `HTR412-${String(i + 1).padStart(3, '0')}`),
];

@Component({
  selector: 'app-flotta-toscana-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ft-page">
      <!-- ── Train grid ── -->
      <ng-container *ngIf="!selectedTrain">
        <div class="ft-header">
          <h2 class="ft-title">Flotta Toscana</h2>
          <span class="ft-count">{{ fleet.length }} treni</span>
        </div>

        <input
          class="ft-search"
          type="search"
          placeholder="Cerca treno…"
          [(ngModel)]="trainSearch"
        />

        <div class="ft-grid">
          <div
            *ngFor="let train of filteredFleet"
            class="ft-train-card"
            [class.ft-train-has-odl]="odlCountFor(train) > 0"
            (click)="openTrain(train)"
          >
            <span class="ft-train-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                   stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="6" width="22" height="12" rx="3"/>
                <path d="M1 12h22"/>
                <circle cx="6" cy="18" r="2"/>
                <circle cx="18" cy="18" r="2"/>
                <path d="M6 6V4M18 6V4"/>
                <path d="M4 18H2M22 18h-2"/>
              </svg>
            </span>
            <span class="ft-train-name">{{ train }}</span>
            <span class="ft-train-badge" *ngIf="odlCountFor(train) > 0">
              {{ odlCountFor(train) }} ODL
            </span>
            <span class="ft-train-empty" *ngIf="odlCountFor(train) === 0">nessun ODL</span>
          </div>
        </div>
      </ng-container>

      <!-- ── Train detail ── -->
      <ng-container *ngIf="selectedTrain">
        <div class="ft-header">
          <button class="ft-back" (click)="closeTrain()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                 stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Flotta Toscana
          </button>
          <h2 class="ft-title">{{ selectedTrain }}</h2>
          <span class="ft-count" *ngIf="trainOrders.length">{{ trainOrders.length }} ODL completati</span>
        </div>

        <input
          class="ft-search"
          type="search"
          placeholder="Cerca codice ODL o turno…"
          [(ngModel)]="searchTerm"
        />

        <div *ngIf="!filteredOrders.length" class="ft-empty">
          <div class="ft-empty-icon">🚆</div>
          <p class="ft-empty-title">Nessun ODL completato</p>
          <p class="ft-empty-subtitle">Gli ordini chiusi appariranno qui</p>
        </div>

        <ng-container *ngIf="filteredOrders.length">
          <div class="ft-list-header">
            <span>Codice ODL</span>
            <span>Turno</span>
            <span>Aperto il</span>
            <span>Lavorazioni</span>
            <span>Risolte</span>
            <span>Avanzamento</span>
          </div>
          <div class="ft-list">
            <div
              *ngFor="let order of filteredOrders; trackBy: trackById"
              class="ft-row"
              (click)="toggleDetail(order)"
              [class.ft-row-open]="detailId === order.id"
            >
              <span class="ft-cell ft-cell-code">{{ order.codiceODL }}</span>
              <span class="ft-cell ft-cell-shift">{{ order.shift }}</span>
              <span class="ft-cell ft-cell-date">{{ (order.openedAt || order.createdAt) | date:'dd/MM/yyyy HH:mm' }}</span>
              <span class="ft-cell ft-cell-center">{{ order.tasks.length }}</span>
              <span class="ft-cell ft-cell-center">{{ countResolved(order) }}</span>
              <span class="ft-cell ft-cell-progress">
                <span class="ft-progress-track">
                  <span class="ft-progress-bar" [style.width.%]="getRate(order)"></span>
                </span>
                <span class="ft-progress-pct">{{ getRate(order) }}%</span>
              </span>

              <!-- Inline task detail -->
              <div class="ft-tasks" *ngIf="detailId === order.id && order.tasks.length">
                <div class="ft-tasks-header">
                  <span>Descrizione</span>
                  <span>Tipo</span>
                  <span>Ditta</span>
                  <span>Stato</span>
                </div>
                <div *ngFor="let task of order.tasks" class="ft-task-row">
                  <span class="ft-task-desc">{{ task.description }}</span>
                  <span class="ft-task-cell">{{ task.priority | titlecase }}</span>
                  <span class="ft-task-cell">{{ task.assignedTechnicianName || '—' }}</span>
                  <span class="ft-task-cell" [ngClass]="'ft-status-' + task.status">{{ statusLabel(task.status) }}</span>
                </div>
              </div>
              <div class="ft-tasks ft-tasks-empty" *ngIf="detailId === order.id && !order.tasks.length">
                Nessuna lavorazione registrata
              </div>
            </div>
          </div>
        </ng-container>
      </ng-container>
    </div>
  `,
  styles: [
    `
      :host {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .ft-page {
        display: flex;
        flex-direction: column;
        flex: 1;
        background: rgba(9, 13, 26, 0.92);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 24px;
        gap: 16px;
        overflow-y: auto;
        box-shadow: var(--glass-shadow);
      }

      .ft-header {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      .ft-title {
        font-size: 18px;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
        flex: 1;
      }

      .ft-count {
        font-size: 12px;
        color: var(--text-secondary);
        background: rgba(255, 255, 255, 0.06);
        padding: 4px 10px;
        border-radius: 999px;
        flex-shrink: 0;
      }

      .ft-back {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-secondary);
        border-radius: 10px;
        padding: 6px 12px;
        font-size: 12px;
        cursor: pointer;
        flex-shrink: 0;
        transition: background 0.15s;
      }

      .ft-back:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
      }

      .ft-search {
        flex-shrink: 0;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
        border-radius: 12px;
        padding: 10px 14px;
        font-size: 13px;
        width: 100%;
        box-sizing: border-box;
      }

      /* ── Train grid ── */
      .ft-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 12px;
      }

      .ft-train-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 20px 14px 16px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.07);
        background: rgba(255, 255, 255, 0.02);
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s, transform 0.15s;
        text-align: center;
      }

      .ft-train-card:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.14);
        transform: translateY(-2px);
      }

      .ft-train-has-odl {
        border-color: rgba(123, 199, 255, 0.25);
        background: rgba(123, 199, 255, 0.04);
      }

      .ft-train-has-odl:hover {
        border-color: rgba(123, 199, 255, 0.45);
        background: rgba(123, 199, 255, 0.08);
      }

      .ft-train-icon {
        width: 36px;
        height: 36px;
        color: rgba(255, 255, 255, 0.25);
      }

      .ft-train-has-odl .ft-train-icon {
        color: #7bc7ff;
        filter: drop-shadow(0 0 6px rgba(123, 199, 255, 0.4));
      }

      .ft-train-icon svg {
        width: 100%;
        height: 100%;
      }

      .ft-train-name {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-primary);
        letter-spacing: 0.3px;
      }

      .ft-train-badge {
        font-size: 11px;
        font-weight: 600;
        color: #7bc7ff;
        background: rgba(123, 199, 255, 0.12);
        padding: 3px 10px;
        border-radius: 999px;
      }

      .ft-train-empty {
        font-size: 11px;
        color: var(--text-muted, rgba(255,255,255,0.25));
      }

      /* ── ODL list ── */
      .ft-empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        text-align: center;
        padding: 40px;
      }

      .ft-empty-icon {
        font-size: 52px;
        opacity: 0.3;
        line-height: 1;
      }

      .ft-empty-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
      }

      .ft-empty-subtitle {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 0;
      }

      .ft-list-header {
        display: grid;
        grid-template-columns: 160px 1fr 150px 80px 70px 1fr;
        gap: 10px;
        padding: 6px 14px;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: var(--text-secondary);
        flex-shrink: 0;
      }

      .ft-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .ft-row {
        display: grid;
        grid-template-columns: 160px 1fr 150px 80px 70px 1fr;
        gap: 10px;
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.06);
        background: rgba(255, 255, 255, 0.02);
        align-items: center;
        cursor: pointer;
        transition: border-color 0.15s ease, background 0.15s ease;
      }

      .ft-row:hover {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.12);
      }

      .ft-row-open {
        border-color: rgba(74, 222, 128, 0.35);
        background: rgba(74, 222, 128, 0.04);
        grid-template-columns: 160px 1fr 150px 80px 70px 1fr;
        grid-template-rows: auto auto;
      }

      .ft-cell {
        font-size: 13px;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
      }

      .ft-cell-code {
        font-size: 12px;
        color: var(--text-secondary);
        font-family: monospace;
      }

      .ft-cell-shift {
        font-size: 12px;
        color: var(--text-secondary);
      }

      .ft-cell-date {
        font-size: 12px;
        color: var(--text-muted);
      }

      .ft-cell-center {
        text-align: center;
        color: var(--text-secondary);
      }

      .ft-cell-progress {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .ft-progress-track {
        flex: 1;
        height: 6px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        overflow: hidden;
        min-width: 40px;
      }

      .ft-progress-bar {
        display: block;
        height: 100%;
        background: linear-gradient(90deg, #4ade80, #16a34a);
        border-radius: inherit;
      }

      .ft-progress-pct {
        font-size: 12px;
        color: #4ade80;
        font-weight: 600;
        flex-shrink: 0;
        width: 36px;
        text-align: right;
      }

      /* Inline task detail */
      .ft-tasks {
        grid-column: 1 / -1;
        margin-top: 6px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        padding-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .ft-tasks-empty {
        font-size: 12px;
        color: var(--text-secondary);
        padding: 8px 0;
      }

      .ft-tasks-header {
        display: grid;
        grid-template-columns: 1fr 120px 120px 110px;
        gap: 10px;
        padding: 4px 10px;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.7px;
        color: var(--text-secondary);
      }

      .ft-task-row {
        display: grid;
        grid-template-columns: 1fr 120px 120px 110px;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.04);
        align-items: center;
      }

      .ft-task-desc {
        font-size: 13px;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ft-task-cell {
        font-size: 12px;
        color: var(--text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ft-status-risolte { color: #4ade80; }
      .ft-status-rimandato { color: #ef4444; }
      .ft-status-in_progress { color: #facc15; }
      .ft-status-aperta { color: #fb923c; }

      @media (max-width: 900px) {
        .ft-list-header,
        .ft-row {
          grid-template-columns: 1fr 1fr 1fr;
        }

        .ft-cell-shift,
        .ft-cell-date {
          display: none;
        }

        .ft-list-header span:nth-child(2),
        .ft-list-header span:nth-child(3) {
          display: none;
        }
      }

      @media (max-width: 600px) {
        .ft-grid {
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        }

        .ft-tasks-header,
        .ft-task-row {
          grid-template-columns: 1fr 1fr;
        }
      }
    `,
  ],
})
export class FlottaToscanaPageComponent implements OnInit, OnDestroy {
  readonly fleet = FLEET;

  completedOrders: WorkOrder[] = [];
  selectedTrain: string | null = null;
  trainSearch = '';
  searchTerm = '';
  detailId: string | null = null;

  private sub?: Subscription;

  constructor(private workOrderService: WorkOrderService) {}

  ngOnInit(): void {
    this.sub = this.workOrderService.getWorkOrders().subscribe((orders) => {
      this.completedOrders = orders
        .filter((o) => o.status === 'completed')
        .sort((a, b) => {
          const da = new Date(a.createdAt ?? 0).getTime();
          const db = new Date(b.createdAt ?? 0).getTime();
          return db - da;
        });
    });
  }

  get filteredFleet(): string[] {
    const q = this.trainSearch.trim().toLowerCase();
    if (!q) return this.fleet;
    return this.fleet.filter((t) => t.toLowerCase().includes(q));
  }

  get trainOrders(): WorkOrder[] {
    if (!this.selectedTrain) return [];
    return this.completedOrders.filter((o) => o.trainNumber === this.selectedTrain);
  }

  get filteredOrders(): WorkOrder[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.trainOrders;
    return this.trainOrders.filter(
      (o) =>
        o.codiceODL.toLowerCase().includes(q) ||
        o.shift.toLowerCase().includes(q),
    );
  }

  odlCountFor(train: string): number {
    return this.completedOrders.filter((o) => o.trainNumber === train).length;
  }

  openTrain(train: string): void {
    this.selectedTrain = train;
    this.searchTerm = '';
    this.detailId = null;
  }

  closeTrain(): void {
    this.selectedTrain = null;
    this.detailId = null;
  }

  toggleDetail(order: WorkOrder): void {
    this.detailId = this.detailId === order.id ? null : order.id;
  }

  trackById(_: number, order: WorkOrder): string {
    return order.id;
  }

  countResolved(order: WorkOrder): number {
    return order.tasks.filter((t) => t.status === 'risolte' || t.status === 'rimandato').length;
  }

  getRate(order: WorkOrder): number {
    if (!order.tasks.length) return 0;
    return Math.round((this.countResolved(order) / order.tasks.length) * 100);
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      aperta: 'Aperta',
      in_progress: 'In corso',
      risolte: 'Risolta',
      rimandato: 'Rimandato',
    };
    return map[status] ?? status;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
