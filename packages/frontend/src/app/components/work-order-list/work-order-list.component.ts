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
    <div class="work-order-list-container">
      <ng-container *ngIf="filteredWorkOrders$ | async as workOrders">
        <div class="list-header">
          <div>
            <h3 class="header-title">Seleziona treno</h3>
          </div>
        </div>


        <div class="new-order-section">
          <div class="train-number-fields">
            <select [(ngModel)]="trainPrefix" class="select-field">
              <option *ngFor="let option of trainPrefixOptions" [value]="option">
                {{ option }}
              </option>
            </select>
            <select [(ngModel)]="trainCode" class="select-field">
              <option *ngFor="let option of trainNumberOptions" [value]="option">
                {{ option }}
              </option>
            </select>
          </div>
          <input
            type="text"
            inputmode="numeric"
            maxlength="10"
            placeholder="Numero ODL (10 cifre)"
            [(ngModel)]="odlNumber"
            class="input-field"
          />
          <button (click)="createOrder()" class="btn-create" [disabled]="creatingOrder">
            {{ creatingOrder ? 'Creazione...' : 'Nuovo +' }}
          </button>
        </div>

        <div class="header-controls">
          <input
            class="search-field"
            type="search"
            placeholder="Cerca codice, treno o turno"
            [(ngModel)]="searchTerm"
            (ngModelChange)="updateSearchTerm($event)"
          />
          <label class="completed-toggle">
            <input
              type="checkbox"
              [checked]="showCompletedOrders"
              (change)="toggleShowCompletedOrders($any($event.target).checked)"
            />
            <span>Mostra ODL completati</span>
          </label>
        </div>

        <div *ngIf="workOrders.length > 0; else emptyState" class="orders-list">
          <div
            *ngFor="let order of workOrders"
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
              <div class="order-created">
                Creato {{ order.createdAt | date: 'dd/MM/yyyy HH:mm' }}
              </div>
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

      .completed-toggle {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: var(--text-secondary);
      }

      .completed-toggle input {
        width: 16px;
        height: 16px;
      }

      .new-order-section {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        padding: 16px 0;
      }

      .train-number-fields {
        display: flex;
        flex-direction: column;
        gap: 8px;
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
        background: rgba(255, 255, 255, 0.04);
        border-radius: 10px;
        padding: 10px 12px;
      }

      .btn-create {
        align-self: flex-end;
        background: linear-gradient(180deg, #ff8e3a, #ff5d1e);
        color: #0b0b0b;
        border: none;
        padding: 10px 18px;
        border-radius: 999px;
        font-weight: 600;
        box-shadow: 0 12px 18px rgba(255, 124, 45, 0.35);
        transition: transform 0.2s ease;
      }

      .btn-create:hover {
        transform: translateY(-1px);
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
        .new-order-section {
          padding: 12px 0;
        }

        .order-card {
          padding: 12px 14px;
        }

        .order-title-row {
          flex-direction: column;
          align-items: flex-start;
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
  searchTerm = '';
  showCompletedOrders = false;
  private selectedWorkOrder: WorkOrder | null = null;
  private workOrderService = inject(WorkOrderService);
  private technicianService = inject(TechnicianService);
  private capoturnoSessionService = inject(CapoturnoSessionService);
  private readonly searchTerm$ = new BehaviorSubject('');
  private readonly showCompleted$ = new BehaviorSubject(false);

  constructor() {
    this.workOrders$ = this.workOrderService.getWorkOrders();
    this.technicians$ = this.technicianService.getTechnicians();
    this.filteredWorkOrders$ = combineLatest([
      this.workOrders$,
      this.searchTerm$,
      this.showCompleted$,
    ]).pipe(
      map(([orders, searchValue, showCompleted]) =>
        this.filterOrders(orders, searchValue, showCompleted),
      ),
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

  createOrder(): void {
    const trainNumber = `${this.trainPrefix}-${this.trainCode}`;
    const shift = this.capoturnoSession?.shift ?? '';
    const odlNumber = this.odlNumber.trim();
    if (!this.trainPrefix.trim() || !this.trainCode.trim() || !shift.trim()) {
      return;
    }
    if (!/^\d{10}$/.test(odlNumber)) {
      return;
    }

    this.creatingOrder = true;
    this.workOrderService.createWorkOrder(trainNumber, shift, undefined, odlNumber).subscribe({
      next: () => {
        this.trainPrefix = this.trainPrefixOptions[0];
        this.trainCode = this.trainNumberOptions[0];
        this.odlNumber = '';
        this.workOrderService.saveWorkOrders();
        this.creatingOrder = false;
      },
      error: () => {
        this.creatingOrder = false;
      },
    });
  }

  selectOrder(order: WorkOrder): void {
    this.workOrderService.selectWorkOrder(order);
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
    const resolved = order.tasks.filter((task) => task.status === 'risolte').length;
    return Math.round((resolved / total) * 100);
  }

  updateSearchTerm(value: string): void {
    this.searchTerm = value;
    this.searchTerm$.next(value);
  }

  toggleShowCompletedOrders(show: boolean): void {
    this.showCompletedOrders = show;
    this.showCompleted$.next(show);
  }

  private filterOrders(
    orders: WorkOrder[],
    searchValue: string,
    showCompleted: boolean,
  ): WorkOrder[] {
    const normalized = searchValue.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        !normalized ||
        order.trainNumber.toLowerCase().includes(normalized) ||
        order.codiceODL.toLowerCase().includes(normalized) ||
        order.shift.toLowerCase().includes(normalized);
      if (!matchesSearch) {
        return false;
      }
      const isHidden = order.status === 'completed' || order.status === 'cancelled';
      if (showCompleted) {
        return true;
      }
      if (normalized) {
        return true;
      }
      return !isHidden;
    });
  }

  // Intentionally no local shift selection: uses capoturno session.
}
