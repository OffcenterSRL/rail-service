import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';

export interface TicketRecord {
  _id: string;
  userId: string;
  trainId: string;
  departureStation: string;
  arrivalStation: string;
  departureTime: string;
  arrivalTime: string;
  seatNumber: string;
  price: number;
  status: 'active' | 'used' | 'cancelled';
  bookingDate: string;
}

export interface TicketPayload {
  userId: string;
  trainId: string;
  departureStation: string;
  arrivalStation: string;
  departureTime: string;
  arrivalTime: string;
  seatNumber?: string;
  price: number;
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
}
