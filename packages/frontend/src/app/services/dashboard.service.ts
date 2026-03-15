import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../api.config';

export interface DashboardStats {
  interventions: number;
  techniciansOnline: number;
  shiftsCompleted: number;
  activeTickets: number;
  cancelledTickets: number;
  lastUpdated: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardStats> {
    return this.http
      .get<{ data: DashboardStats }>(`${API_BASE_URL}/dashboard`)
      .pipe(map((response) => response.data));
  }
}
