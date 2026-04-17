import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { APP_VERSION } from './app-version';
import { AdminComponent } from './components/admin/admin.component';
import { WorkOrderListComponent } from './components/work-order-list/work-order-list.component';
import { AuthService, CapoturnoSession, TechnicianSession } from './services/auth.service';
import { CapoturnoSessionService } from './services/capoturno-session.service';
import { DashboardService, DashboardStats } from './services/dashboard.service';
import { Task, WorkOrder, WorkOrderService } from './services/work-order.service';
import { Technician, TechnicianService } from './services/technician.service';

type AssignedTask = {
  description: string;
  priority: Task['priority'];
  status: Task['status'];
  orderCode: string;
  trainNumber: string;
  orderId: string;
  taskId: string;
  performedBy?: Task['performedBy'];
  timeSpentMinutes?: number;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterOutlet,
    WorkOrderListComponent,
    AdminComponent,
  ],
  template: `
    <div class="app-shell">
      <header class="header">
        <div class="header-content">
          <div class="logo">
            <span class="logo-icon">🚂</span>
            <span class="logo-text">HMU SERVICE</span>
          </div>
          <div class="header-right">
            <div class="status-pill">3 ordini attivi</div>
            <div class="view-toggle">
              <button
                class="view-btn"
                [class.active]="viewMode === 'capoturno'"
                (click)="setView('capoturno')"
              >
                Capoturno
              </button>
              <button
                class="view-btn"
                [class.active]="viewMode === 'tecnico'"
                (click)="setView('tecnico')"
              >
                Tecnico
              </button>
              <button
                class="view-btn"
                [class.active]="viewMode === 'admin'"
                (click)="setView('admin')"
              >
                Admin
              </button>
            </div>
            <button
              *ngIf="viewMode === 'capoturno' && capoturnoSession"
              class="logout-btn"
              type="button"
              (click)="logoutCapoturno()"
            >
              Esci
            </button>
            <button
              *ngIf="viewMode === 'tecnico' && technicianSession"
              class="logout-btn"
              type="button"
              (click)="logoutTechnician()"
            >
              Esci
            </button>
          </div>
        </div>
      </header>

      <section class="hero-strip" *ngIf="viewMode !== 'tecnico' && !(viewMode === 'capoturno' && !capoturnoSession)">
        <div class="hero-strip-top">
            <div class="hero-copy">
              <p class="hero-label">Dashboard Operativa</p>
              <h1>
              {{ capoturnoName }} • Turno {{ getShiftLabel(capoturnoShift) }}
              </h1>
              <button
                *ngIf="viewMode === 'capoturno' && capoturnoSession"
                class="hero-export"
                type="button"
                (click)="exportCapoturnoShift()"
              >
                Esporta turno
              </button>
              <p class="hero-subtitle">
                {{
                  viewMode === 'capoturno'
                  ? ''
                  : 'Admin view · aggiorna i tecnici e i parametri operativi'
                }}
              </p>
          </div>
          <div class="hero-metrics">
            <div class="metric-card">
              <span class="metric-value">{{ getOpenOrdersForShift().length }}</span>
              <span class="metric-label">Interventi totali</span>
            </div>
            <div class="metric-card">
              <span class="metric-value">{{ getOpenOrdersForShift().length }}</span>
              <span class="metric-label">ODL attivi</span>
            </div>
            <div class="metric-card">
              <span class="metric-value">{{
                dashboardStats.lastUpdated | date: 'shortTime'
              }}</span>
              <span class="metric-label">Ultimo aggiornamento</span>
            </div>
          </div>
        </div>
      </section>

      <div class="main-layout">
        <ng-container [ngSwitch]="viewMode">
          <ng-container *ngSwitchCase="'capoturno'">
            <ng-container *ngIf="capoturnoSession; else capoturnoLogin">
              <aside class="sidebar">
                <div class="sidebar-content">
                  <div class="assigned-header">
                    <h2 class="sidebar-title">ORDINI DI LAVORO</h2>
                  </div>
                  <app-work-order-list></app-work-order-list>
                </div>
              </aside>
              <main class="main-content">
                <router-outlet></router-outlet>
              </main>
            </ng-container>
            <ng-template #capoturnoLogin>
              <div class="tecnico-panel">
                <div class="panel-shell">
                  <div class="panel-heading">
                    <h2>Login Capoturno</h2>
                    <span class="panel-subtitle">
                      Accedi con nickname, matricola e turno per gestire gli ordini.
                    </span>
                  </div>
                  <p
                    *ngIf="capoturnoLoginState"
                    class="login-message"
                    [class.success]="capoturnoLoginState.type === 'success'"
                    [class.error]="capoturnoLoginState.type === 'error'"
                  >
                    {{ capoturnoLoginState.message }}
                  </p>
                  <div class="field">
                    <label>Nickname</label>
                    <input type="text" [(ngModel)]="capoturnoNickname" placeholder="es. Giulia" />
                  </div>
                  <div class="field">
                    <label>Matricola</label>
                    <input type="text" [(ngModel)]="capoturnoMatricola" placeholder="C-2001" />
                  </div>
                  <div class="field">
                    <label>Turno</label>
                    <select [(ngModel)]="capoturnoShift">
                      <option *ngFor="let option of capoturnoShiftOptions" [value]="option">
                        {{ option }}
                      </option>
                    </select>
                  </div>
                  <button class="btn btn-primary" (click)="loginCapoturno()">
                    Accedi come capoturno
                  </button>
                </div>
              </div>
            </ng-template>
          </ng-container>

          <ng-container *ngSwitchCase="'tecnico'">
            <div class="tecnico-panel">
              <div class="panel-shell">
                <div class="panel-heading">
                  <h2>Login Tecnico</h2>
                  <span class="panel-subtitle"
                    >Accedi con nickname e matricola per vedere le tue
                    lavorazioni.</span
                  >
                </div>
                <p
                  *ngIf="loginState"
                  class="login-message"
                  [class.success]="loginState.type === 'success'"
                  [class.error]="loginState.type === 'error'"
                >
                  {{ loginState.message }}
                </p>
                <ng-container *ngIf="!technicianSession">
                  <div class="field">
                    <label>Nickname</label>
                    <input
                      type="text"
                      [(ngModel)]="tecNickname"
                      placeholder="es. Carlo"
                    />
                  </div>
                  <div class="field">
                    <label>Matricola</label>
                    <input
                      type="text"
                      [(ngModel)]="tecMatricola"
                      placeholder="123456"
                    />
                  </div>
                  <button class="btn btn-primary" (click)="loginTechnician()">
                    Accedi come tecnico
                  </button>
                </ng-container>
                <div *ngIf="technicianSession" class="assigned-tasks">
                  <div class="assigned-header">
                    <h3>Lavorazioni per {{ technicianSession.nickname }}</h3>
                    <div class="assigned-actions">
                    </div>
                  </div>
                  <div class="assigned-controls">
                    <input
                      type="search"
                      [(ngModel)]="searchTerm"
                      (ngModelChange)="updateSearchTerm($event)"
                      placeholder="Cerca lavorazioni, treno o codice"
                    />
                  </div>
                  <div *ngIf="assignedTasks.length === 0" class="task-empty">
                    <p>Nessuna lavorazione assegnata per il momento.</p>
                  </div>
                  <div
                    *ngFor="let item of assignedTasks"
                    class="assigned-task"
                    [class.active]="selectedTask?.taskId === item.taskId"
                    (click)="openTaskCompilation(item)"
                  >
                    <div class="assigned-task-header">
                      <span class="task-order"
                        >{{ item.orderCode }} · {{ item.trainNumber }}</span
                      >
                      <span class="task-status-pill">{{
                        item.status | uppercase
                      }}</span>
                    </div>
                    <p class="task-description">{{ item.description }}</p>
                    <span class="task-priority" [ngClass]="item.priority">{{
                      item.priority | titlecase
                    }}</span>
                  </div>
                  <div *ngIf="selectedTask" class="task-compile-card">
                  <div class="compile-header" *ngIf="selectedTask as currentTask">
                    <h4>Compila lavorazione</h4>
                      <span>{{ currentTask.orderCode }} · {{ currentTask.trainNumber }}</span>
                    <span class="status-pill" [ngClass]="currentTask.status">
                      {{ taskStatusLabel(currentTask.status) }}
                    </span>
                  </div>
                    <label class="compile-field">
                      <span>Stato lavorazione</span>
                      <select [(ngModel)]="taskStatus">
                        <option value="aperta">Aperta</option>
                        <option value="in_progress">In corso</option>
                        <option value="rimandato">Rimandato</option>
                        <option value="risolte">Completato</option>
                      </select>
                    </label>
                    <label class="compile-field">
                      <span>Tempo totale</span>
                      <div class="compile-time">
                        <select [(ngModel)]="taskTimeSpentHours">
                          <option *ngFor="let hour of timeHoursOptions" [value]="hour">
                            {{ hour }} h
                          </option>
                        </select>
                        <select [(ngModel)]="taskTimeSpentMinutes">
                          <option *ngFor="let minute of timeMinutesOptions" [value]="minute">
                            {{ minute }} min
                          </option>
                        </select>
                      </div>
                    </label>
                    <div class="compile-technicians">
                      <div
                        *ngFor="let row of taskTechnicians; let i = index"
                        class="compile-tech-row"
                      >
                        <select [(ngModel)]="row.technicianId">
                          <option value="">Seleziona tecnico</option>
                          <option *ngFor="let tech of technicianList" [value]="tech.id">
                            {{ tech.name }}
                          </option>
                        </select>
                        <span class="tech-matricola">{{
                          getTechnicianMatricola(row.technicianId)
                        }}</span>
                        <button type="button" class="btn btn-tertiary" (click)="removeTechnicianRow(i)">
                          Rimuovi
                        </button>
                      </div>
                      <button type="button" class="btn btn-tertiary" (click)="addTechnicianRow()">
                        Aggiungi tecnico
                      </button>
                    </div>
                    <div class="compile-actions">
                      <button class="btn btn-primary" type="button" (click)="saveTaskCompilation()">
                        Salva compilazione
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

          <ng-container *ngSwitchCase="'admin'">
            <div class="admin-placeholder">
              <app-admin></app-admin>
            </div>
          </ng-container>
        </ng-container>
      </div>
      <footer class="app-footer">Versione {{ appVersion }}</footer>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        color: var(--text-primary);
      }

      .app-shell {
        display: flex;
        flex-direction: column;
        gap: 20px;
        min-height: 100vh;
        padding: 20px 0;
        width: 100%;
        box-sizing: border-box;
      }

      .header {
        background: rgba(16, 18, 30, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 16px 28px;
        backdrop-filter: blur(14px);
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .logo {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 20px;
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      .logo-icon {
        font-size: 28px;
      }

      .logo-text {
        color: var(--text-primary);
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .status-pill {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 6px 14px;
        border-radius: 999px;
        font-size: 13px;
        letter-spacing: 0.4px;
        text-transform: uppercase;
      }

      .hero-strip {
        background: #0b0f1d;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 18px 26px;
        display: flex;
        flex-direction: column;
        gap: 18px;
        backdrop-filter: blur(15px);
      }

      .hero-strip-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        flex-wrap: wrap;
      }

      .hero-copy {
        flex: 1 1 280px;
        min-height: 1px;
        min-width: 240px;
      }

      .hero-label {
        font-size: 12px;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }

      .hero-copy h1 {
        font-size: 24px;
        margin-bottom: 4px;
      }

      .hero-export {
        margin-top: 6px;
        padding: 10px 18px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.08);
        color: var(--text-primary);
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .hero-export:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
      }

      .hero-subtitle {
        font-size: 13px;
        color: var(--text-secondary);
      }

      .hero-metrics {
        flex: 1 1 320px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
        overflow: hidden;
      }

      .metric-card {
        background: rgba(255, 255, 255, 0.04);
        border-radius: 16px;
        padding: 12px 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        min-width: 90px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .metric-support {
        font-size: 11px;
        color: var(--text-muted);
      }

      .metric-card.accent {
        background: linear-gradient(180deg, #ff8e3a, #ff5d1e);
        color: #0b0b0b;
      }

      .metric-value {
        font-size: 26px;
        font-weight: 600;
      }

      .metric-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: inherit;
        opacity: 0.85;
      }

      .view-toggle {
        display: inline-flex;
        gap: 6px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.05);
        padding: 4px;
      }

      .view-btn {
        border: none;
        background: transparent;
        color: var(--text-secondary);
        padding: 6px 12px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        transition: all 0.2s ease;
      }

      .view-btn.active {
        background: rgba(255, 255, 255, 0.18);
        color: #fff;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.3);
      }

      .logout-btn {
        padding: 6px 14px;
        border-radius: 999px;
        border: 1px solid rgba(255, 77, 79, 0.5);
        background: rgba(255, 77, 79, 0.12);
        color: #ff6b6b;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      }

      .logout-btn:hover {
        transform: translateY(-1px);
        border-color: rgba(255, 77, 79, 0.8);
        box-shadow: 0 10px 18px rgba(255, 77, 79, 0.25);
      }

      .tecnico-login {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tecnico-panel {
        display: flex;
        align-items: stretch;
        justify-content: center;
        min-height: calc(100vh - 200px);
        padding: 0 24px;
        width: 100%;
      }

      .panel-shell {
        flex: 1;
        width: 100%;
        max-width: none;
        background: rgba(12, 14, 28, 0.95);
        padding: 32px;
        border-radius: 28px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        flex-direction: column;
        gap: 18px;
      }

      .panel-heading h2 {
        margin: 0;
        font-size: 26px;
      }

      .panel-subtitle {
        color: var(--text-secondary);
        font-size: 13px;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .field label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--text-secondary);
      }

      .field input {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: var(--text-primary);
        border-radius: 10px;
        padding: 12px;
      }

      .login-message {
        font-size: 12px;
        color: var(--text-secondary);
        margin: 0;
      }

      .login-message.success {
        color: var(--accent-lime);
      }

      .login-message.error {
        color: var(--error);
      }

      .panel-shell .btn {
        width: fit-content;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 14px 28px;
        border-radius: 999px;
        font-weight: 600;
        font-size: 14px;
        border: none;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }

      .panel-shell .btn-primary {
        background: linear-gradient(180deg, #7bc7ff, #4b6ef5);
        color: #02050c;
        box-shadow: 0 12px 32px rgba(75, 110, 245, 0.35);
      }

      .panel-shell .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 14px 34px rgba(75, 110, 245, 0.35);
      }

      .panel-shell .btn-tertiary {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: var(--text-primary);
      }

      .assigned-tasks {
        margin-top: 18px;
        border-top: 1px dashed rgba(255, 255, 255, 0.25);
        padding-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .assigned-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .assigned-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .assigned-task {
        background: rgba(255, 255, 255, 0.04);
        border-radius: 14px;
        padding: 12px 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        flex-direction: column;
        gap: 6px;
        cursor: pointer;
        transition: border-color 0.2s ease, transform 0.2s ease;
      }

      .assigned-task.active {
        border-color: rgba(123, 199, 255, 0.6);
        box-shadow: 0 12px 24px rgba(75, 110, 245, 0.2);
        transform: translateY(-1px);
      }

      .assigned-task-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }

      .task-order {
        font-size: 13px;
        letter-spacing: 0.5px;
        color: var(--text-secondary);
      }

      .task-status-pill {
        font-size: 11px;
        background: rgba(124, 199, 255, 0.2);
        color: var(--text-primary);
        padding: 4px 10px;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .task-compile-card {
        margin-top: 16px;
        background: rgba(15, 18, 32, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .compile-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        color: var(--text-secondary);
        font-size: 12px;
      }

      .status-pill {
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 999px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        font-weight: 600;
        color: var(--text-primary);
      }

      .status-pill.aperta {
        background: rgba(255, 124, 45, 0.18);
        color: #ff9d5c;
      }

      .status-pill.in_progress {
        background: rgba(124, 199, 255, 0.16);
        color: #7bc7ff;
      }

      .status-pill.risolte {
        background: rgba(130, 255, 169, 0.16);
        color: #82ffa9;
      }

      .compile-header h4 {
        margin: 0;
        color: var(--text-primary);
        font-size: 16px;
      }

      .compile-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 12px;
        color: var(--text-secondary);
      }

      .compile-field input {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        color: var(--text-primary);
        padding: 10px 12px;
      }

      .compile-time {
        display: flex;
        gap: 10px;
      }

      .compile-time select {
        flex: 1;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        color: var(--text-primary);
        padding: 10px 12px;
      }

      .compile-technicians {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .compile-tech-row {
        display: grid;
        grid-template-columns: minmax(200px, 1fr) minmax(140px, 1fr) auto;
        gap: 10px;
        align-items: center;
      }

      .compile-tech-row select {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        color: var(--text-primary);
        padding: 8px 10px;
      }

      .tech-matricola {
        font-size: 12px;
        color: var(--text-secondary);
      }

      .compile-actions {
        display: flex;
        justify-content: flex-end;
      }

      .task-description {
        font-size: 14px;
        color: var(--text-primary);
        margin: 0;
      }

      .task-priority {
        font-size: 11px;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        color: #fff;
        padding: 2px 10px;
        border-radius: 999px;
        align-self: flex-start;
      }

      .task-priority.preventiva {
        background: rgba(90, 176, 255, 0.7);
      }

      .task-priority.correttiva {
        background: rgba(255, 144, 65, 0.7);
      }

      .task-priority.urgente {
        background: rgba(255, 77, 79, 0.8);
      }

      .task-empty {
        border: 1px dashed rgba(255, 255, 255, 0.3);
        border-radius: 14px;
        padding: 12px 14px;
        color: var(--text-secondary);
        font-size: 13px;
      }

      .assigned-controls input {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: var(--text-primary);
        border-radius: 10px;
        padding: 8px 12px;
      }

      .app-footer {
        padding: 12px 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        text-align: right;
        font-size: 12px;
        color: var(--text-secondary);
      }

      .main-layout {
        display: flex;
        flex: 1;
        gap: 16px;
        min-height: 0;
      }

      .admin-placeholder {
        width: 100%;
      }

      .sidebar {
        width: 320px;
        background: rgba(17, 22, 35, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 18px;
        padding: 18px 0;
        box-shadow: var(--glass-shadow);
      }

      .sidebar-content {
        padding: 12px 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .sidebar-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: var(--text-secondary);
      }

      .main-content {
        flex: 1;
        background: rgba(9, 13, 26, 0.92);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 32px;
        box-shadow: var(--glass-shadow);
        overflow-y: auto;
      }

      @media (max-width: 1100px) {
        .main-layout {
          flex-direction: column;
        }

        .sidebar {
          width: 100%;
        }
      }

      @media (max-width: 1024px) {
        body {
          padding: 0 16px;
        }

        .hero-strip {
          flex-direction: column;
          align-items: flex-start;
        }

        .hero-metrics {
          justify-content: flex-start;
        }

        .main-content {
          padding: 24px;
        }
      }

      @media (max-width: 768px) {
        body {
          padding: 0 10px;
        }

        .hero-strip {
          padding: 16px;
        }

        .header {
          padding: 12px 18px;
        }

        .hero-copy h1 {
          font-size: 22px;
        }

        .hero-metrics {
          justify-content: flex-start;
        }

        .main-content {
          padding: 20px;
        }
      }

      @media (max-width: 600px) {
        .header-content {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .status-pill {
          font-size: 11px;
          padding: 4px 10px;
        }

        .hero-strip {
          flex-direction: column;
          min-height: auto;
        }

        .hero-metrics {
          width: 100%;
          justify-content: space-between;
        }

        .metric-card {
          flex: 1;
          min-width: 0;
        }

        .main-content {
          padding: 16px;
        }

        .login-card {
          padding: 20px;
        }

        .main-layout {
          gap: 10px;
        }

        .sidebar {
          padding: 12px 0;
          border-radius: 16px;
        }

        .main-content {
          border-radius: 16px;
          padding: 12px;
        }

        .app-footer {
          text-align: center;
        }
      }
    `,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  viewMode: 'capoturno' | 'tecnico' | 'admin' = 'capoturno';
  tecNickname = '';
  tecMatricola = '';
  loginState: { type: 'success' | 'error'; message: string } | null = null;
  technicianSession: TechnicianSession | null = null;
  capoturnoSession: CapoturnoSession | null = null;
  assignedTasks: AssignedTask[] = [];
  technicianList: Technician[] = [];
  selectedTask: AssignedTask | null = null;
  taskTimeSpentHours = '0';
  taskTimeSpentMinutes = '0';
  taskStatus: Task['status'] = 'aperta';
  taskTechnicians: Array<{ technicianId: string }> = [{ technicianId: '' }];
  selectedWorkOrder: WorkOrder | null = null;
  capoturnoName = 'Capoturno';
  capoturnoNickname = '';
  capoturnoMatricola = '';
  capoturnoShift = 'Mattina (06-14)';
  readonly capoturnoShiftOptions = [
    'Mattina (06-14)',
    'Pomeriggio (14-22)',
    'Notte (22-06)',
  ];
  capoturnoLoginState: { type: 'success' | 'error'; message: string } | null = null;
  allWorkOrders: WorkOrder[] = [];
  searchTerm = '';
  showCompletedOrders = false;
  appVersion = APP_VERSION;
  dashboardStats: DashboardStats = {
    interventions: 0,
    techniciansOnline: 0,
    shiftsCompleted: 0,
    activeTickets: 0,
    cancelledTickets: 0,
    lastUpdated: new Date().toISOString(),
  };
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private capoturnoSessionService = inject(CapoturnoSessionService);
  private workOrderService = inject(WorkOrderService);
  private technicianService = inject(TechnicianService);
  private router = inject(Router);
  private assignedTasksSub?: Subscription;
  private techniciansSub?: Subscription;
  private workOrdersSub?: Subscription;
  private selectedWorkOrderSub?: Subscription;
  private workOrdersSnapshot: WorkOrder[] = [];
  readonly timeHoursOptions = Array.from({ length: 13 }, (_, index) => String(index));
  readonly timeMinutesOptions = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
  private readonly technicianStorageKey = 'rail-service.tech-session';
  private readonly viewModeStorageKey = 'rail-service.view-mode';

  setView(mode: 'capoturno' | 'tecnico' | 'admin'): void {
    this.applyViewMode(mode);
  }

  private applyViewMode(
    mode: 'capoturno' | 'tecnico' | 'admin',
    options?: { persist?: boolean; skipRouter?: boolean },
  ): void {
    this.viewMode = mode;
    this.loginState = null;
    if (mode !== 'tecnico') {
      this.clearTechnicianSession();
    }
    if (options?.persist !== false) {
      this.persistViewMode(mode);
    }
    if (options?.skipRouter !== true && mode !== 'admin') {
      this.router.navigateByUrl('/');
    }
  }

  private clearTechnicianSession(): void {
    this.assignedTasksSub?.unsubscribe();
    this.assignedTasksSub = undefined;
    this.assignedTasks = [];
    this.technicianSession = null;
  }

  toggleShowCompletedOrders(): void {
    this.showCompletedOrders = !this.showCompletedOrders;
    if (this.technicianSession) {
      this.updateAssignedTasksView(
        this.technicianSession.nickname.toLowerCase(),
      );
    }
  }

  updateSearchTerm(term: string): void {
    this.searchTerm = term;
    if (this.technicianSession) {
      this.updateAssignedTasksView(
        this.technicianSession.nickname.toLowerCase(),
      );
    }
  }

  loginTechnician(): void {
    if (!this.tecNickname || !this.tecMatricola) {
      this.loginState = {
        type: 'error',
        message: 'Inserisci nickname e matricola per accedere.',
      };
      return;
    }

    this.authService
      .loginTechnician({
        nickname: this.tecNickname,
        matricola: this.tecMatricola,
      })
      .subscribe({
        next: (session) => {
          this.technicianSession = session;
          this.loginState = { type: 'success', message: session.message };
          this.assignedTasksSub?.unsubscribe();
          this.watchAssignedTasks(session.nickname);
          this.persistTechnicianSession(session);
          this.searchTerm = '';
          this.showCompletedOrders = false;
        },
        error: (error) => {
          const message =
            error?.error?.error ?? 'Errore durante il login tecnico.';
          this.loginState = { type: 'error', message };
        },
      });
  }

  loginCapoturno(): void {
    if (!this.capoturnoNickname || !this.capoturnoMatricola || !this.capoturnoShift) {
      this.capoturnoLoginState = {
        type: 'error',
        message: 'Inserisci nickname, matricola e turno per accedere.',
      };
      return;
    }

    this.authService
      .loginCapoturno({
        nickname: this.capoturnoNickname,
        matricola: this.capoturnoMatricola,
      })
      .subscribe({
        next: (session) => {
          this.capoturnoSessionService.setSession({
            ...session,
            shift: this.capoturnoShift,
          });
          this.capoturnoLoginState = { type: 'success', message: session.message };
        },
        error: (error) => {
          const message = error?.error?.error ?? 'Errore durante il login capoturno.';
          this.capoturnoLoginState = { type: 'error', message };
        },
      });
  }

  ngOnInit(): void {
    this.restoreViewMode();
    this.loadDashboardStats();
    this.restoreTechnicianSession();
    this.capoturnoSessionService.getSession().subscribe((session) => {
      this.capoturnoSession = session;
      this.capoturnoName = session?.name ?? 'Capoturno';
      if (session?.shift) {
        this.capoturnoShift = session.shift;
      }
    });
    this.workOrdersSub = this.workOrderService.getWorkOrders().subscribe((orders) => {
      this.allWorkOrders = orders;
    });
    this.techniciansSub = this.technicianService.getTechnicians().subscribe((list) => {
      this.technicianList = list;
    });
    this.selectedWorkOrderSub = this.workOrderService
      .getSelectedWorkOrder()
      .subscribe((order) => {
        this.selectedWorkOrder = order;
      });
  }

  private loadDashboardStats(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (stats) => {
        this.dashboardStats = stats;
      },
      error: () => {
        this.dashboardStats = {
          interventions: 0,
          techniciansOnline: 0,
          shiftsCompleted: 0,
          activeTickets: 0,
          cancelledTickets: 0,
          lastUpdated: new Date().toISOString(),
        };
      },
    });
  }

  private watchAssignedTasks(nickname: string | null): void {
    this.assignedTasksSub?.unsubscribe();
    if (!nickname) {
      this.assignedTasks = [];
      return;
    }
    const normalized = nickname.toLowerCase();
    this.assignedTasksSub = this.workOrderService
      .getWorkOrders()
      .subscribe((orders) => {
        this.workOrdersSnapshot = orders;
        this.updateAssignedTasksView(normalized);
      });
  }

  getShiftLabel(shift?: string): string {
    if (!shift) {
      return 'In corso';
    }
    const normalized = shift.toLowerCase();
    if (normalized.includes('mattina') || normalized.includes('06-14')) {
      return 'Mattina';
    }
    if (normalized.includes('pomeriggio') || normalized.includes('14-22')) {
      return 'Pomeriggio';
    }
    if (normalized.includes('notte') || normalized.includes('22-06')) {
      return 'Notte';
    }
    return shift;
  }

  getOpenOrdersForShift(): WorkOrder[] {
    const shift = this.capoturnoShift;
    return this.allWorkOrders.filter(
      (order) => order.shift === shift && order.status !== 'completed' && order.status !== 'cancelled',
    );
  }

  exportCapoturnoShift(): void {
    if (!this.capoturnoSession) {
      return;
    }
    const shift = this.capoturnoShift;
    const orders = this.allWorkOrders.filter((order) => order.shift === shift);
    const rows = orders.flatMap((order) => {
      if (!order.tasks.length) {
        return [
          `
          <tr>
            <td>${this.escapeHtml(order.trainNumber)}</td>
            <td>${this.escapeHtml(order.codiceODL)}</td>
            <td>${this.escapeHtml(order.shift)}</td>
            <td>${this.escapeHtml(this.formatStatus(order.status))}</td>
            <td>${this.escapeHtml(this.formatDateForExport(order.createdAt))}</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          `,
        ];
      }
      return order.tasks.map(
        (task, index) => `
          <tr>
            <td>${this.escapeHtml(order.trainNumber)}</td>
            <td>${this.escapeHtml(order.codiceODL)}</td>
            <td>${this.escapeHtml(order.shift)}</td>
            <td>${this.escapeHtml(this.formatStatus(order.status))}</td>
            <td>${this.escapeHtml(this.formatDateForExport(order.createdAt))}</td>
            <td>${index + 1}</td>
            <td>${this.escapeHtml(task.description)}</td>
            <td>${this.escapeHtml(this.formatPriority(task.priority))}</td>
            <td>${this.escapeHtml(this.formatStatus(task.status))}</td>
            <td>${this.escapeHtml(task.assignedTechnicianName)}</td>
            <td>${this.escapeHtml(task.assignedTechnicianNickname)}</td>
            <td>${this.escapeHtml(task.assignedTechnicianId ?? '')}</td>
          </tr>
        `,
      );
    });

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #999; padding: 6px 8px; font-size: 12px; }
            th { background: #f0f0f0; text-align: left; }
            .meta td { border: none; padding: 4px 0; }
          </style>
        </head>
        <body>
          <h3>Turno ${this.escapeHtml(this.capoturnoName)} • ${this.escapeHtml(shift)}</h3>
          <table class="meta">
            <tr><td><strong>Capoturno:</strong> ${this.escapeHtml(this.capoturnoName)}</td></tr>
            <tr><td><strong>Matricola:</strong> ${this.escapeHtml(this.capoturnoSession.matricola)}</td></tr>
            <tr><td><strong>Turno:</strong> ${this.escapeHtml(shift)}</td></tr>
            <tr><td><strong>Esportato il:</strong> ${this.escapeHtml(this.formatDateForExport(new Date()))}</td></tr>
          </table>
          <br />
          <table>
            <thead>
              <tr>
                <th>Treno</th>
                <th>Codice ODL</th>
                <th>Turno</th>
                <th>Stato ODL</th>
                <th>Creato il</th>
                <th>#</th>
                <th>Descrizione</th>
                <th>Priorità</th>
                <th>Stato Task</th>
                <th>Tecnico</th>
                <th>Nickname</th>
                <th>ID Tecnico</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length ? rows.join('') : '<tr><td colspan="12">Nessun ordine nel turno selezionato</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const filename = `turno-${this.escapeFilename(this.capoturnoName)}-${this.formatDateForFilename(
      new Date(),
    )}.xls`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private formatDateForExport(date?: Date): string {
    if (!date) {
      return '';
    }
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(date));
  }

  private formatDateForFilename(date?: Date): string {
    if (!date) {
      return 'sconosciuta';
    }
    const formatted = this.formatDateForExport(date).replace(/[/: ]+/g, '-');
    return formatted.toLowerCase();
  }

  private formatPriority(priority: Task['priority']): string {
    if (priority === 'preventiva') return 'Preventiva';
    if (priority === 'correttiva') return 'Correttiva';
    return 'Urgente';
  }

  private formatStatus(status: Task['status'] | WorkOrder['status']): string {
    if (status === 'in_progress') return 'In corso';
    if (status === 'risolte') return 'Risolte';
    if (status === 'rimandato') return 'Rimandato';
    if (status === 'aperta') return 'Aperta';
    if (status === 'pending') return 'In attesa';
    if (status === 'active') return 'In corso';
    if (status === 'completed') return 'Completato';
    if (status === 'cancelled') return 'Annullato';
    return String(status);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeFilename(value: string): string {
    return value.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').toLowerCase();
  }

  logoutTechnician(): void {
    this.clearStoredTechnicianSession();
    this.clearTechnicianSession();
    this.tecNickname = '';
    this.tecMatricola = '';
    this.searchTerm = '';
    this.showCompletedOrders = false;
    this.loginState = { type: 'success', message: 'Logout completato.' };
  }

  logoutCapoturno(): void {
    this.capoturnoSessionService.clearSession();
    this.capoturnoNickname = '';
    this.capoturnoMatricola = '';
    this.capoturnoShift = this.capoturnoShiftOptions[0];
    this.capoturnoLoginState = { type: 'success', message: 'Logout completato.' };
  }

  private updateAssignedTasksView(normalized: string): void {
    let tasks = this.workOrdersSnapshot.flatMap((order) =>
      order.tasks
        .filter(() => true)
        .map((task: Task) => ({
          description: task.description,
          priority: task.priority,
          status: task.status,
          orderCode: order.codiceODL,
          trainNumber: order.trainNumber,
          orderId: order.id,
          taskId: task.id,
          performedBy: task.performedBy,
          timeSpentMinutes: task.timeSpentMinutes,
        })),
    );
    const search = this.searchTerm.trim().toLowerCase();
    if (search) {
      tasks = tasks.filter(
        (item) =>
          item.description.toLowerCase().includes(search) ||
          item.orderCode.toLowerCase().includes(search) ||
          item.trainNumber.toLowerCase().includes(search),
      );
    }
    this.assignedTasks = tasks;
    if (this.selectedTask) {
      const refreshed =
        this.assignedTasks.find((task) => task.taskId === this.selectedTask?.taskId) ?? null;
      this.selectedTask = refreshed;
      if (!refreshed) {
        this.taskTimeSpentHours = '0';
        this.taskTimeSpentMinutes = '00';
        this.taskStatus = 'aperta';
        this.taskTechnicians = [{ technicianId: '' }];
      }
    }
  }

  openTaskCompilation(task: AssignedTask): void {
    this.selectedTask = task;
    if (task.timeSpentMinutes) {
      const hours = Math.floor(task.timeSpentMinutes / 60);
      const minutes = task.timeSpentMinutes % 60;
      this.taskTimeSpentHours = String(hours);
      this.taskTimeSpentMinutes = minutes.toString().padStart(2, '0');
    } else {
      this.taskTimeSpentHours = '0';
      this.taskTimeSpentMinutes = '00';
    }
    this.taskStatus = task.status;
    if (task.performedBy?.length) {
      this.taskTechnicians = task.performedBy.map((tech) => ({ technicianId: tech.id }));
    } else {
      this.taskTechnicians = [{ technicianId: this.findLoggedTechnicianId() }];
    }
  }

  addTechnicianRow(): void {
    this.taskTechnicians = [...this.taskTechnicians, { technicianId: '' }];
  }

  removeTechnicianRow(index: number): void {
    if (this.taskTechnicians.length <= 1) {
      this.taskTechnicians = [{ technicianId: '' }];
      return;
    }
    this.taskTechnicians = this.taskTechnicians.filter((_, i) => i !== index);
  }

  saveTaskCompilation(): void {
    if (!this.selectedTask) {
      return;
    }
    const hours = Number(this.taskTimeSpentHours);
    const minutes = Number(this.taskTimeSpentMinutes);
    const timeSpentMinutes = hours * 60 + minutes;
    if (Number.isNaN(timeSpentMinutes) || timeSpentMinutes < 0) {
      return;
    }
    const performedBy = this.taskTechnicians
      .map((row) => this.technicianList.find((tech) => tech.id === row.technicianId))
      .filter((tech): tech is Technician => !!tech)
      .map((tech) => ({
        id: tech.id,
        name: tech.name,
        matricola: tech.matricola,
      }));

    this.workOrderService.updateTask(this.selectedTask.orderId, this.selectedTask.taskId, {
      timeSpentMinutes,
      performedBy,
      status: this.taskStatus,
    });
    this.selectedTask = null;
  }

  taskStatusLabel(status: Task['status']): string {
    if (status === 'in_progress') return 'In corso';
    if (status === 'risolte') return 'Risolte';
    if (status === 'rimandato') return 'Rimandato';
    return 'Aperta';
  }

  getTechnicianMatricola(technicianId: string): string {
    const technician = this.technicianList.find((tech) => tech.id === technicianId);
    return technician?.matricola ?? '';
  }

  private findLoggedTechnicianId(): string {
    if (!this.technicianSession) {
      return '';
    }
    const normalizedMatricola = this.technicianSession.matricola.toUpperCase();
    const match = this.technicianList.find(
      (tech) =>
        tech.matricola.toUpperCase() === normalizedMatricola ||
        tech.nickname.toLowerCase() === this.technicianSession?.nickname.toLowerCase(),
    );
    return match?.id ?? '';
  }

  private restoreTechnicianSession(): void {
    const session = this.readStoredTechnicianSession();
    if (!session) {
      return;
    }
    this.technicianSession = session;
    this.tecNickname = session.nickname;
    this.tecMatricola = session.matricola;
    this.loginState = {
      type: 'success',
      message: session.message ?? 'Sessione ripristinata.',
    };
    this.searchTerm = '';
    this.showCompletedOrders = false;
    this.watchAssignedTasks(session.nickname);
  }

  private persistTechnicianSession(session: TechnicianSession): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(
        this.technicianStorageKey,
        JSON.stringify(session),
      );
    } catch {
      // ignore
    }
  }

  private readStoredTechnicianSession(): TechnicianSession | null {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      const raw = window.localStorage.getItem(this.technicianStorageKey);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as TechnicianSession;
    } catch {
      return null;
    }
  }

  private clearStoredTechnicianSession(): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.removeItem(this.technicianStorageKey);
  }

  private restoreViewMode(): void {
    const stored = this.readStoredViewMode();
    if (!stored) {
      return;
    }
    this.applyViewMode(stored, { persist: false, skipRouter: true });
  }

  private persistViewMode(mode: 'capoturno' | 'tecnico' | 'admin'): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(this.viewModeStorageKey, mode);
  }

  private readStoredViewMode(): 'capoturno' | 'tecnico' | 'admin' | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const stored = window.localStorage.getItem(this.viewModeStorageKey);
    if (stored === 'capoturno' || stored === 'tecnico' || stored === 'admin') {
      return stored;
    }
    return null;
  }

  ngOnDestroy(): void {
    this.assignedTasksSub?.unsubscribe();
    this.techniciansSub?.unsubscribe();
    this.workOrdersSub?.unsubscribe();
    this.selectedWorkOrderSub?.unsubscribe();
  }
}
