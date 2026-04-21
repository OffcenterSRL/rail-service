import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WorkOrder, WorkOrderService } from '../../services/work-order.service';
import { CapoturnoSessionService } from '../../services/capoturno-session.service';
import { CapoturnoSession } from '../../services/auth.service';
import { Technician, TechnicianService } from '../../services/technician.service';

@Component({
  selector: 'app-work-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Modal inserimento ODL -->
    <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <span class="modal-title">Inserisci ODL</span>
          <button class="modal-close" (click)="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <label class="field-label">Tipo treno</label>
          <select [(ngModel)]="trainPrefix" class="select-field">
            <option *ngFor="let option of trainPrefixOptions" [value]="option">{{ option }}</option>
          </select>
          <label class="field-label">Numero unità</label>
          <select [(ngModel)]="trainCode" class="select-field">
            <option *ngFor="let option of trainNumberOptions" [value]="option">{{ option }}</option>
          </select>
          <label class="field-label">Numero ODL</label>
          <input
            type="text"
            inputmode="numeric"
            maxlength="12"
            placeholder="12 cifre"
            [(ngModel)]="odlNumber"
            class="input-field"
          />
          <label class="field-label">Data apertura ODL</label>
          <input type="date" [(ngModel)]="openedAtDate" class="input-field" />
          <label class="field-label">Ora apertura ODL</label>
          <input type="time" [(ngModel)]="openedAtTime" class="input-field" />
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeModal()">Annulla</button>
          <button class="btn-create" (click)="createOrder()" [disabled]="creatingOrder">
            {{ creatingOrder ? 'Creazione...' : 'Crea ODL' }}
          </button>
        </div>
      </div>
    </div>

    <div class="work-order-list-container">
      <ng-container *ngIf="filteredWorkOrders$ | async as workOrders">
        <div class="list-header">
          <button class="btn-inserisci" (click)="openModal()">Inserisci ODL</button>
        </div>

        <div class="header-controls">
          <input
            class="search-field"
            type="search"
            placeholder="Cerca codice, treno o turno"
            [(ngModel)]="searchTerm"
            (ngModelChange)="updateSearchTerm($event)"
          />
        </div>

        <div *ngIf="workOrders.length > 0; else emptyState" class="orders-list">
          <div
            *ngFor="let order of workOrders; trackBy: trackByOrderId"
            (click)="selectOrder(order)"
            class="order-card"
            [class.active]="isOrderActive(order)"
          >
            <div class="order-title-row">
              <div class="order-title">{{ order.trainNumber }}</div>
              <span class="order-status" [ngClass]="order.status">
                {{ statusLabel(order.status) }}
              </span>
            </div>
            <div class="order-info">
              <div>{{ order.codiceODL }}</div>
            </div>
            <div class="order-footer">
              <div class="order-meta">
            </div>
            </div>
            <div class="order-progress">
              <div class="order-progress-label">
                <span>Avanzamento</span>
                <span>{{ getCompletionRate(order) }}%</span>
              </div>
              <div class="order-progress-track">
                <span class="order-progress-bar" [style.width.%]="getCompletionRate(order)"></span>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-template #emptyState>
        <div class="empty-state">
          <p>Nessun ordine salvato</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .work-order-list-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        height: 100%;
      }

      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .header-label {
        font-size: 11px;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: var(--text-secondary);
      }

      .header-title {
        font-size: 16px;
        margin: 4px 0 0 0;
      }

      .orders-count {
        font-size: 12px;
        color: var(--text-secondary);
      }

      .header-controls {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
        padding-top: 12px;
      }

      .search-field {
        flex: 1;
        min-width: 220px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
        border-radius: 12px;
        padding: 10px 14px;
        font-size: 13px;
      }

      .btn-inserisci {
        width: 100%;
        background: linear-gradient(180deg, #ff8e3a, #ff5d1e);
        color: #0b0b0b;
        border: none;
        padding: 10px 16px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 8px 16px rgba(255, 124, 45, 0.3);
        transition: transform 0.2s ease;
      }

      .btn-inserisci:hover {
        transform: translateY(-1px);
      }

      /* Modal */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }

      .modal-box {
        background: #131a27;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 18px;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        gap: 0;
        overflow: hidden;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      }

      .modal-title {
        font-size: 16px;
        font-weight: 700;
        letter-spacing: 0.3px;
      }

      .modal-close {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 16px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: color 0.15s;
      }

      .modal-close:hover {
        color: var(--text-primary);
      }

      .modal-body {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 20px 24px;
      }

      .field-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: var(--text-secondary);
        margin-bottom: 2px;
      }

      .input-field {
        width: 100%;
        font-size: 13px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
        border-radius: 12px;
        padding: 10px 14px;
      }

      .select-field {
        width: 100%;
        font-size: 13px;
        background: rgba(20, 28, 41, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
        border-radius: 10px;
        padding: 10px 12px;
      }

      .modal-footer {
        display: flex;
        gap: 10px;
        padding: 16px 24px 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.07);
        justify-content: flex-end;
      }

      .btn-cancel {
        background: rgba(255, 255, 255, 0.06);
        color: var(--text-secondary);
        border: none;
        padding: 10px 18px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 600;
        transition: background 0.15s;
      }

      .btn-cancel:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .btn-create {
        background: linear-gradient(180deg, #ff8e3a, #ff5d1e);
        color: #0b0b0b;
        border: none;
        padding: 10px 20px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 8px 16px rgba(255, 124, 45, 0.35);
        transition: transform 0.2s ease;
      }

      .btn-create:hover {
        transform: translateY(-1px);
      }

      .btn-create:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .orders-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow-y: auto;
        flex: 1;
        padding-right: 4px;
      }

      .order-card {
        background: rgba(20, 28, 41, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 14px;
        padding: 14px 16px;
        cursor: pointer;
        transition: border-color 0.2s ease, transform 0.2s ease;
        box-shadow: 0 15px 30px rgba(3, 7, 18, 0.6);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .order-card:hover {
        border-color: rgba(255, 255, 255, 0.12);
        transform: translateY(-1px);
      }

      .order-card.active {
        border-color: var(--accent-orange);
        box-shadow: 0 20px 40px rgba(255, 124, 45, 0.3);
      }

      .order-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
        gap: 12px;
        flex-wrap: wrap;
      }

      .order-title {
        font-size: 15px;
        font-weight: 600;
      }

      .order-status {
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }

      .order-status.active {
        background: rgba(124, 199, 255, 0.16);
        color: var(--accent-blue);
      }

      .order-status.pending {
        background: rgba(255, 124, 45, 0.16);
        color: var(--accent-orange);
      }

      .order-status.completed {
        background: rgba(130, 255, 169, 0.16);
        color: var(--accent-lime);
      }

      .order-status.cancelled {
        background: rgba(255, 108, 108, 0.16);
        color: #ff6c6c;
      }

      .order-info {
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 10px;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 8px;
      }

      .order-created {
        font-size: 11px;
        color: var(--text-muted);
        margin-top: 4px;
      }

      .order-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .order-progress {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .order-progress-label {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: var(--text-secondary);
      }

      .order-progress-track {
        height: 6px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        overflow: hidden;
      }

      .order-progress-bar {
        display: block;
        height: 100%;
        background: linear-gradient(90deg, #7bc7ff, #4b6ef5);
      }

      .order-assignment {
        font-size: 12px;
        color: var(--text-secondary);
        letter-spacing: 0.3px;
        text-transform: uppercase;
      }

      .order-meta {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: var(--text-muted);
      }

      .order-meta {
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }

      .empty-state {
        text-align: center;
        padding: 26px 12px;
        color: var(--text-secondary);
        font-size: 14px;
        border: 1px dashed rgba(255, 255, 255, 0.2);
        border-radius: 14px;
      }

      @media (max-width: 600px) {
        .order-card {
          padding: 12px 14px;
        }

        .order-title-row {
          flex-direction: row;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
        }

        .order-footer {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }

        .orders-list {
          gap: 10px;
        }

        .header-controls {
          flex-direction: column;
          align-items: stretch;
        }

        .search-field {
          min-width: 0;
          width: 100%;
        }

        .modal-footer {
          flex-direction: column;
        }

        .btn-cancel,
        .btn-create {
          width: 100%;
          text-align: center;
        }
      }
    `,
  ],
})
export class WorkOrderListComponent implements OnInit {
  workOrders$: Observable<WorkOrder[]>;
  filteredWorkOrders$: Observable<WorkOrder[]>;
  technicians$: Observable<Technician[]>;
  trainPrefix = 'HTR312';
  trainCode = '001';
  odlNumber = '';
  readonly trainPrefixOptions = ['HTR312', 'HTR412'];
  readonly trainNumberOptions = Array.from({ length: 100 }, (_, index) =>
    String(index + 1).padStart(3, '0'),
  );
  capoturnoSession: CapoturnoSession | null = null;
  creatingOrder = false;
  showModal = false;
  openedAtDate = '';
  openedAtTime = '';
  searchTerm = '';
  private selectedWorkOrder: WorkOrder | null = null;
  private workOrderService = inject(WorkOrderService);
  private technicianService = inject(TechnicianService);
  private capoturnoSessionService = inject(CapoturnoSessionService);
  private readonly searchTerm$ = new BehaviorSubject('');

  constructor() {
    this.workOrders$ = this.workOrderService.getWorkOrders();
    this.technicians$ = this.technicianService.getTechnicians();
    this.filteredWorkOrders$ = combineLatest([
      this.workOrders$,
      this.searchTerm$,
    ]).pipe(
      map(([orders, searchValue]) => this.filterOrders(orders, searchValue)),
    );
    this.capoturnoSessionService.getSession().subscribe((session) => {
      this.capoturnoSession = session;
    });
  }

  ngOnInit(): void {
    this.workOrderService.getSelectedWorkOrder().subscribe((order) => {
      this.selectedWorkOrder = order;
    });
  }

  openModal(): void {
    const now = new Date();
    this.openedAtDate = now.toISOString().slice(0, 10);
    this.openedAtTime = now.toTimeString().slice(0, 5);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  createOrder(): void {
    const trainNumber = `${this.trainPrefix}-${this.trainCode}`;
    const shift = this.capoturnoSession?.shift ?? '';
    const odlNumber = this.odlNumber.trim();
    if (!this.trainPrefix.trim() || !this.trainCode.trim() || !shift.trim()) {
      return;
    }
    if (!/^\d{12}$/.test(odlNumber)) {
      return;
    }

    let openedAt: Date | undefined;
    if (this.openedAtDate) {
      openedAt = new Date(`${this.openedAtDate}T${this.openedAtTime || '00:00'}`);
    }

    this.creatingOrder = true;
    this.workOrderService.createWorkOrder(trainNumber, shift, undefined, odlNumber, openedAt).subscribe({
      next: () => {
        this.trainPrefix = this.trainPrefixOptions[0];
        this.trainCode = this.trainNumberOptions[0];
        this.odlNumber = '';
        this.workOrderService.saveWorkOrders();
        this.creatingOrder = false;
        this.showModal = false;
      },
      error: () => {
        this.creatingOrder = false;
      },
    });
  }

  selectOrder(order: WorkOrder): void {
    this.workOrderService.selectWorkOrder(order);
  }

  trackByOrderId(_index: number, order: WorkOrder): string {
    return order.id;
  }

  isOrderActive(order: WorkOrder): boolean {
    return this.selectedWorkOrder?.id === order.id;
  }

  statusLabel(status: WorkOrder['status']): string {
    const map: Record<WorkOrder['status'], string> = {
      pending: 'In attesa',
      active: 'In corso',
      completed: 'Completato',
      cancelled: 'Annullato',
    };
    return map[status];
  }

  getCompletionRate(order: WorkOrder): number {
    const total = order.tasks.length;
    if (!total) {
      return 0;
    }
    const resolved = order.tasks.filter((task) => task.status === 'risolte' || task.status === 'rimandato').length;
    return Math.round((resolved / total) * 100);
  }

  updateSearchTerm(value: string): void {
    this.searchTerm = value;
    this.searchTerm$.next(value);
  }

  private sortTrainNumber(a: string, b: string): number {
    const parse = (s: string) => {
      if (!s) return { series: 0, unit: 0 };
      const m = s.match(/^([A-Za-z]+)(\d+)[-_]?(\d*)$/);
      if (!m) return { series: 0, unit: 0 };
      return { series: parseInt(m[2], 10), unit: parseInt(m[3] || '0', 10) };
    };
    const pa = parse(a);
    const pb = parse(b);
    if (pa.series !== pb.series) return pa.series - pb.series;
    return pa.unit - pb.unit;
  }

  private filterOrders(orders: WorkOrder[], searchValue: string): WorkOrder[] {
    const normalized = searchValue.trim().toLowerCase();
    return orders
      .filter((order) => {
        if (order.status === 'completed' || order.status === 'cancelled') return false;
        return (
          !normalized ||
          order.trainNumber.toLowerCase().includes(normalized) ||
          order.codiceODL.toLowerCase().includes(normalized) ||
          order.shift.toLowerCase().includes(normalized)
        );
      })
      .sort((a, b) => {
        const byTrain = this.sortTrainNumber(a.trainNumber, b.trainNumber);
        if (byTrain !== 0) return byTrain;
        return a.codiceODL.localeCompare(b.codiceODL);
      });
  }

  // Intentionally no local shift selection: uses capoturno session.
}
