import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { API_BASE_URL } from '../api.config';

export interface TechnicianSnapshot {
  techniciansOnline: number;
  active: Array<{ codiceODL: string; shift: string; team: string }>;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class TechnicianPresenceService implements OnDestroy {
  private socket?: WebSocket;
  private reconnectTimer: number | null = null;
  private readonly wsUrl: string;
  readonly snapshot$ = new BehaviorSubject<TechnicianSnapshot>({
    techniciansOnline: 0,
    active: [],
    updatedAt: new Date().toISOString(),
  });

  constructor() {
    const apiUrl = new URL(API_BASE_URL);
    apiUrl.pathname = '/ws/technicians';
    apiUrl.protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    apiUrl.search = '';
    apiUrl.hash = '';
    this.wsUrl = apiUrl.toString();

    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  ngOnDestroy(): void {
    this.socket?.close();
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
    }
  }

  private connect(): void {
    this.socket = new WebSocket(this.wsUrl);

    this.socket.addEventListener('message', (event) => {
      try {
        const snapshot: TechnicianSnapshot = JSON.parse(event.data);
        this.snapshot$.next(snapshot);
      } catch {
        // ignore malformed payloads
      }
    });

    this.socket.addEventListener('close', () => {
      this.scheduleReconnect();
    });

    this.socket.addEventListener('error', () => {
      this.socket?.close();
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
    }
    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, 5000);
  }
}
