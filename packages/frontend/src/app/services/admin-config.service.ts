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

export interface CapoturnoConfig {
  id?: string;
  name: string;
  nickname: string;
  matricola: string;
  role?: 'capoturno' | 'admin';
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
      .get<{ data: Array<TechnicianConfig & { _id?: string }> }>(`${API_BASE_URL}/admin/technicians`, {
        headers: this.buildHeaders(password),
      })
      .pipe(map((response) => response.data.map((t) => ({ ...t, id: t.id ?? t._id ?? '' }))));
  }

  updateTechnicians(password: string, technicians: TechnicianConfig[]): Observable<TechnicianConfig[]> {
    return this.http
      .put<{ data: Array<TechnicianConfig & { _id?: string }> }>(
        `${API_BASE_URL}/admin/technicians`,
        { technicians },
        { headers: this.buildHeaders(password) },
      )
      .pipe(map((response) => response.data.map((t) => ({ ...t, id: t.id ?? t._id ?? '' }))));
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

  getCapoturni(password: string): Observable<CapoturnoConfig[]> {
    return this.http
      .get<{ data: Array<CapoturnoConfig & { _id?: string }> }>(`${API_BASE_URL}/admin/capoturni`, {
        headers: this.buildHeaders(password),
      })
      .pipe(map((response) => response.data.map((c) => ({ ...c, id: c.id ?? c._id ?? '' }))));
  }

  updateCapoturni(password: string, capoturni: CapoturnoConfig[]): Observable<CapoturnoConfig[]> {
    return this.http
      .put<{ data: Array<CapoturnoConfig & { _id?: string }> }>(
        `${API_BASE_URL}/admin/capoturni`,
        { capoturni },
        { headers: this.buildHeaders(password) },
      )
      .pipe(map((response) => response.data.map((c) => ({ ...c, id: c.id ?? c._id ?? '' }))));
  }

  saveCapoturno(password: string, capoturno: CapoturnoConfig): Observable<CapoturnoConfig> {
    const headers = this.buildHeaders(password);
    const payload = {
      name: capoturno.name,
      nickname: capoturno.nickname,
      matricola: capoturno.matricola,
      role: capoturno.role ?? 'capoturno',
      id: capoturno.id,
    };
    if (capoturno.id) {
      return this.http
        .put<{ data: CapoturnoConfig }>(`${API_BASE_URL}/admin/capoturni/${capoturno.id}`, payload, { headers })
        .pipe(map((response) => response.data));
    }
    return this.http
      .post<{ data: CapoturnoConfig }>(`${API_BASE_URL}/admin/capoturni`, payload, { headers })
      .pipe(map((response) => response.data));
  }

  deleteCapoturno(password: string, capoturnoId: string): Observable<CapoturnoConfig[]> {
    return this.http
      .delete<{ data: CapoturnoConfig[] }>(`${API_BASE_URL}/admin/capoturni/${capoturnoId}`, {
        headers: this.buildHeaders(password),
      })
      .pipe(map((response) => response.data));
  }
}
