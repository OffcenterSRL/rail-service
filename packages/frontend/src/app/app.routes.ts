import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TicketsComponent } from './components/tickets/tickets.component';
import { AdminComponent } from './components/admin/admin.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'tickets', component: TicketsComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' },
];
