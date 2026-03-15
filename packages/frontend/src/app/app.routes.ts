import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TicketsComponent } from './components/tickets/tickets.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'tickets', component: TicketsComponent },
  { path: '**', redirectTo: '' },
];
