import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../api.config';

export interface TechnicianSession {
  name: string;
  nickname: string;
  matricola: string;
  team: string;
  message: string;
}

export interface CapoturnoSession {
  name: string;
  nickname: string;
  matricola: string;
  shift: string;
  message: string;
  role?: 'capoturno' | 'admin';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  loginTechnician(payload: {
    nickname: string;
    matricola: string;
  }): Observable<TechnicianSession> {
    return this.http
      .post<{ data: TechnicianSession }>(`${API_BASE_URL}/auth/technician-login`, payload)
      .pipe(map((response) => response.data));
  }

  loginCapoturno(payload: {
    nickname: string;
    matricola: string;
  }): Observable<CapoturnoSession> {
    return this.http
      .post<{ data: CapoturnoSession }>(`${API_BASE_URL}/auth/capoturno-login`, payload)
      .pipe(map((response) => response.data));
  }
}
