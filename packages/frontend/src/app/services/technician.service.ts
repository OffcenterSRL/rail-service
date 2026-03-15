import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../api.config';

export interface Technician {
  id: string;
  name: string;
  nickname: string;
  matricola: string;
  team: string;
}

@Injectable({
  providedIn: 'root',
})
export class TechnicianService {
  constructor(private http: HttpClient) {}

  getTechnicians(): Observable<Technician[]> {
    return this.http.get<{ data: Technician[] }>(`${API_BASE_URL}/technicians`).pipe(
      map((response) => response.data),
    );
  }
}
