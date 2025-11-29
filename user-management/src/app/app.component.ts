// ...existing code...
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { MegaMenuItem } from 'primeng/api';
import { MegaMenuModule } from 'primeng/megamenu';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterOutlet, ToastModule, InputTextModule, CardModule, ButtonModule, AvatarModule, MegaMenuModule],
  providers: [MessageService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  items: MegaMenuItem[] | undefined;
  isAuthenticated = false;
  username = '';
  password = '';
  errorMessage = '';
  userRole: string | null = null;

  constructor(private router: Router,
    private authService: AuthService,
    private messageService: MessageService) {
    // keep constructor minimal — menu built in ngOnInit after role is read
  }

  ngOnInit(): void {
    this.isAuthenticated = (localStorage.getItem('isAuthenticated') === 'true');

    // determine role from session/local storage (token or user object)
    this.userRole = this.getRoleFromStorage();
    const isAdmin = !!this.userRole && this.userRole.toLowerCase().includes('admin');

    // build menu conditionally
    this.items = [
      {
        label: 'Dashboard',
        root: true,
        command: () => { this.router.navigate(['/dashboard']); }
      },
      {
        label: 'Users',
        root: true,
        command: () => { this.router.navigate(['/users']); }
      },
      // include Admin only for admin role
      ...(isAdmin ? [{
        label: 'Admin',
        root: true,
        items: [
          [
            {
              items: [
                { label: 'Settings', icon: 'pi pi-list', subtext: 'Settings' },
                {
                  label: 'Upload',
                  icon: 'pi pi-users',
                  subtext: 'Subtext of item',
                  command: () => { this.router.navigate(['/upload']); }
                },
                { label: 'Case Studies', icon: 'pi pi-file', subtext: 'Subtext of item' }
              ]
            }
          ]
        ]
      }] : []),
      {
        label: 'Logout',
        root: true,
        command: () => { this.logout(); }
      }
    ];
  }

  private getRoleFromStorage(): string | null {
    try {
      // Try JWT token in sessionStorage or localStorage under common keys
      const tokenKeys = ['authToken', 'token', 'accessToken', 'jwt'];
      let token: string | null = null;
      for (const k of tokenKeys) {
        token = sessionStorage.getItem(k) || localStorage.getItem(k);
        if (token) break;
      }

      if (token) {
        // Attempt to decode JWT payload
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = parts[1];
          // base64url -> base64
          let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
          while (b64.length % 4) b64 += '=';
          const json = atob(b64);
          const obj = JSON.parse(json);
          if (obj && obj.role) return String(obj.role);
          if (obj && (obj.roles || obj.roles === 0) && Array.isArray(obj.roles)) {
            return String(obj.roles[0]);
          }
          if (obj && obj['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
            return String(obj['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);
          }
        }
      }

      // fallback: look for a stored user object (sessionStorage or localStorage)
      const userJson = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (userJson) {
        const u = JSON.parse(userJson);
        if (u && u.role) return String(u.role);
        if (u && u.roles && Array.isArray(u.roles)) return String(u.roles[0]);
      }
    } catch (e) {
      // ignore decode errors
      console.warn('Failed to read role from storage', e);
    }
    return null;
  }

  login() {
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.isAuthenticated = true;
        localStorage.setItem('isAuthenticated', 'true');
        this.errorMessage = '';
        // refresh role and menu after login
        this.userRole = this.getRoleFromStorage();
        this.ngOnInit();

        this.router.navigate(['/users']);
        this.messageService.add({ severity: 'success', summary: 'Login successful', detail: 'Welcome back!' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Login failed', detail: 'Invalid credentials' });
      }
    });
  }

  logout() {
    this.isAuthenticated = false;
    localStorage.removeItem('isAuthenticated');
    // optional: clear token/user from storage
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.username = '';
    this.password = '';
    this.router.navigate(['/login']);
    this.messageService.add({ severity: 'info', summary: 'Logout successful', detail: 'You have been logged out.' });
  }
}
// ...existing code...