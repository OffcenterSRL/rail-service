import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../api.config';

export interface TechnicianConfig {
  id?: string;
  name: string;
  nickname: string;
  matricola: string;
  team: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminConfigService {
  constructor(private http: HttpClient) {}

  private buildHeaders(password: string): HttpHeaders {
    return new HttpHeaders({ 'x-admin-password': password });
  }

  getTechnicians(password: string): Observable<TechnicianConfig[]> {
    return this.http
      .get<{ data: TechnicianConfig[] }>(`${API_BASE_URL}/admin/technicians`, {
        headers: this.buildHeaders(password),
      })
      .pipe(map((response) => response.data));
  }

  updateTechnicians(password: string, technicians: TechnicianConfig[]): Observable<TechnicianConfig[]> {
    return this.http
      .put<{ data: TechnicianConfig[] }>(
        `${API_BASE_URL}/admin/technicians`,
        { technicians },
        { headers: this.buildHeaders(password) },
      )
      .pipe(map((response) => response.data));
  }

  saveTechnician(password: string, technician: TechnicianConfig): Observable<TechnicianConfig> {
    const headers = this.buildHeaders(password);
    const payload = {
      name: technician.name,
      nickname: technician.nickname,
      matricola: technician.matricola,
      team: technician.team,
      id: technician.id,
    };
    if (technician.id) {
      return this.http
        .put<{ data: TechnicianConfig }>(`${API_BASE_URL}/admin/technicians/${technician.id}`, payload, { headers })
        .pipe(map((response) => response.data));
    }
    return this.http
      .post<{ data: TechnicianConfig }>(`${API_BASE_URL}/admin/technicians`, payload, { headers })
      .pipe(map((response) => response.data));
  }

  deleteTechnician(password: string, technicianId: string): Observable<TechnicianConfig[]> {
    return this.http
      .delete<{ data: TechnicianConfig[] }>(`${API_BASE_URL}/admin/technicians/${technicianId}`, {
        headers: this.buildHeaders(password),
      })
      .pipe(map((response) => response.data));
  }
}
