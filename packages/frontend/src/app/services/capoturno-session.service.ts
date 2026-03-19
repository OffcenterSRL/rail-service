import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CapoturnoSession } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CapoturnoSessionService {
  private readonly storageKey = 'rail-service.capoturno-session';
  private readonly session$ = new BehaviorSubject<CapoturnoSession | null>(this.readStoredSession());

  getSession(): Observable<CapoturnoSession | null> {
    return this.session$.asObservable();
  }

  setSession(session: CapoturnoSession): void {
    this.session$.next(session);
    this.persistSession(session);
  }

  clearSession(): void {
    this.session$.next(null);
    this.persistSession(null);
  }

  private readStoredSession(): CapoturnoSession | null {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as CapoturnoSession;
    } catch {
      return null;
    }
  }

  private persistSession(session: CapoturnoSession | null): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (session) {
        window.localStorage.setItem(this.storageKey, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(this.storageKey);
      }
    } catch {
      // ignore storage errors
    }
  }
}
