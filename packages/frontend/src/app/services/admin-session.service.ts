import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminSessionService {
  private readonly storageKey = 'rail-service.admin-password';
  private loggedIn$ = new BehaviorSubject<boolean>(this.hasStoredPassword());

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  get isLoggedInValue(): boolean {
    return this.loggedIn$.value;
  }

  setLoggedIn(value: boolean): void {
    this.loggedIn$.next(value);
  }

  clearSession(): void {
    try { localStorage.removeItem(this.storageKey); } catch { /* ignore */ }
    this.loggedIn$.next(false);
  }

  private hasStoredPassword(): boolean {
    try { return !!localStorage.getItem(this.storageKey); } catch { return false; }
  }
}
