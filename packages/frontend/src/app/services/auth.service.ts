import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';

export interface TechnicianSession {
  code: string;
  name: string;
  matricola: string;
  shift: string;
  team: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  loginTechnician(payload: {
    code: string;
    name: string;
    matricola: string;
  }): Observable<TechnicianSession> {
    return this.http
      .post<{ data: TechnicianSession }>(`${API_BASE_URL}/auth/technician-login`, payload)
      .pipe(map((response) => response.data));
  }
}
