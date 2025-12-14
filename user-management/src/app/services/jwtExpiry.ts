import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {jwtDecode} from 'jwt-decode';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class JwtExpiryService {

  private logoutTimer: any;
  private warningTimer: any;
  isAuthenticated:any
  private LOGOUT_BEFORE_MS = 0;                 // exact expiry
  private WARNING_BEFORE_MS = 5 * 60 * 1000;    // 5 mins before

  constructor(
    private router: Router,
    private messageService: MessageService 
  ) {
    this.isAuthenticated = (localStorage.getItem('isAuthenticated') === 'true');
  }

  scheduleLogout(token: string) {
    const decoded: any = jwtDecode(token);
    const expiryTime = decoded.exp * 1000;

    const warningTime = expiryTime - this.WARNING_BEFORE_MS;
    const logoutTime  = expiryTime - this.LOGOUT_BEFORE_MS;

    const warningDelay = warningTime - Date.now();
    const logoutDelay  = logoutTime - Date.now();

    // 🔔 Show warning
    if (warningDelay > 0) {
      this.warningTimer = setTimeout(() => {
        this.showWarning();
      }, warningDelay);
    }

    // 🚪 Logout
    if (logoutDelay > 0) {
      this.logoutTimer = setTimeout(() => {
        this.logout();
      }, logoutDelay);
    } else {
      this.logout();
    }
  }

  showWarning() {
    this.messageService.add({
      severity: 'warn',
      summary: 'Session Expiring',
      detail: 'You will be logged out in 5 minutes due to inactivity.',
      life: 10000
    });
  }

   logout() {
        this.isAuthenticated = false;
        localStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('authToken');
        window.location.reload();
        localStorage.removeItem('userRole');
        this.messageService.add({ severity: 'info', summary: 'Logout successful', detail: 'You have been logged out.' });
    }

}
