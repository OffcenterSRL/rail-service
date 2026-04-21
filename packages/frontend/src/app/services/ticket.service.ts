import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../api.config';

export interface TaskRecord {
  _id: string;
  description: string;
  priority: 'preventiva' | 'correttiva' | 'urgente';
  preventiveType?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName: string;
  assignedTechnicianNickname: string;
  status: 'aperta' | 'in_progress' | 'risolte' | 'rimandato';
  timeSpentMinutes?: number;
  performedBy?: Array<{ id: string; name: string; matricola: string }>;
  deferredKey?: string;
  deferredSince?: string;
  deferredCount?: number;
}

export interface TicketRecord {
  _id: string;
  trainNumber: string;
  shift: string;
  codiceODL: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  tasks: TaskRecord[];
  openedAt?: string;
  assignedTechnician?: string;
  createdAt: string;
}

export interface TicketPayload {
  trainNumber: string;
  shift: string;
  codiceODL?: string;
  openedAt?: string;
  assignedTechnician?: string;
}

export interface TaskPayload {
  description: string;
  priority: 'preventiva' | 'correttiva' | 'urgente';
  preventiveType?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName: string;
  assignedTechnicianNickname: string;
  deferredKey?: string;
  deferredSince?: string;
  deferredCount?: number;
}

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  constructor(private http: HttpClient) {}

  getTickets(): Observable<TicketRecord[]> {
    return this.http
      .get<{ data: TicketRecord[] }>(`${API_BASE_URL}/tickets`)
      .pipe(map((response) => response.data));
  }

  getTicket(id: string): Observable<TicketRecord> {
    return this.http
      .get<{ data: TicketRecord }>(`${API_BASE_URL}/tickets/${id}`)
      .pipe(map((response) => response.data));
  }

  bookTicket(payload: TicketPayload): Observable<TicketRecord> {
    return this.http
      .post<{ data: TicketRecord }>(`${API_BASE_URL}/tickets`, payload)
      .pipe(map((response) => response.data));
  }

  cancelTicket(ticketId: string): Observable<TicketRecord> {
    return this.http
      .patch<{ data: TicketRecord }>(`${API_BASE_URL}/tickets/${ticketId}/cancel`, {})
      .pipe(map((response) => response.data));
  }

  completeTicket(ticketId: string): Observable<TicketRecord> {
    return this.http
      .patch<{ data: TicketRecord }>(`${API_BASE_URL}/tickets/${ticketId}/complete`, {})
      .pipe(map((response) => response.data));
  }

  addTask(ticketId: string, task: TaskPayload): Observable<TicketRecord> {
    return this.http
      .post<{ data: TicketRecord }>(`${API_BASE_URL}/tickets/${ticketId}/tasks`, task)
      .pipe(map((response) => response.data));
  }

  updateTask(ticketId: string, taskId: string, updates: Partial<TaskPayload & { status: TaskRecord['status']; timeSpentMinutes: number; performedBy: TaskRecord['performedBy'] }>): Observable<TicketRecord> {
    return this.http
      .put<{ data: TicketRecord }>(`${API_BASE_URL}/tickets/${ticketId}/tasks/${taskId}`, updates)
      .pipe(map((response) => response.data));
  }

  deleteTask(ticketId: string, taskId: string): Observable<TicketRecord> {
    return this.http
      .delete<{ data: TicketRecord }>(`${API_BASE_URL}/tickets/${ticketId}/tasks/${taskId}`)
      .pipe(map((response) => response.data));
  }
}
