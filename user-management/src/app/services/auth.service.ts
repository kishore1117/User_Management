import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiBaseUrl}/user-access/login`; // Your login endpoint
  private tokenKey = 'authToken';

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }) {
    return this.http.post<{ token: string }>(this.apiUrl, credentials).pipe(
      tap(response => {
        sessionStorage.setItem(this.tokenKey, response.token);
      })
    );
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  logout() {
    sessionStorage.removeItem(this.tokenKey);
  }

  decodeToken(): any | null {
  const token = this.getToken();
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (e) {
    console.error('Invalid token');
    return null;
  }
}

  getTokenRemainingTime(): number {
    const decoded = this.decodeToken();
    if (!decoded?.exp) return 0;

    const expiryMs = decoded.exp * 1000;
    return expiryMs - Date.now();
  }

  isTokenExpired(): boolean {
    return this.getTokenRemainingTime() <= 0;
  }

}
