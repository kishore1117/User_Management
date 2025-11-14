import { Component } from '@angular/core';
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
export class AppComponent {
  items: MegaMenuItem[] | undefined;
  isAuthenticated = false;
  username = '';
  password = '';
  errorMessage = '';
  constructor(private router: Router, 
    private authService: AuthService,
    private messageService: MessageService) { 
            this.items = [
            {
                label: 'Dashboard',
                root: true,
                command:()=>{
                                    this.router.navigate(['/dashboard']);
               }
            },
            {
                label: 'Users',
                root: true,
                command: () => {
                    this.router.navigate(['/users']);
                }
            },
            {
                label: 'Admin',
                root: true,
                 items: [
                    [
                        {
                            items: [
                                { label: 'Settings', icon: 'pi pi-list', subtext: 'Settings' },
                                { label: 'Upload', icon: 'pi pi-users', subtext: 'Subtext of item' ,command:()=>{
                                    this.router.navigate(['/upload']);
                                }},
                                { label: 'Case Studies', icon: 'pi pi-file', subtext: 'Subtext of item' }
                            ]
                        }
                    ]
                ]
            },
            {
                label: 'Logout',
                root: true,
                command:()=>{
                                    this.logout();  
                }
            }
        ];
    }

login() {
  this.authService.login({ username: this.username, password: this.password }).subscribe({
    next: () => {
      this.isAuthenticated = true;
      localStorage.setItem('isAuthenticated', 'true');
      this.errorMessage = '';
      // Navigate to dashboard after successful login
      this.router.navigate(['/users']);
      this.messageService.add({
          severity: 'success',
          summary: 'Login successful',
          detail: 'Welcome back!'
        });
    },
    error: () => {
      this.messageService.add({
          severity: 'error',
          summary: 'Login failed',
          detail: 'Invalid credentials'
        });
    }
  });
  // if (this.username === 'admin' && this.password === 'apex@123') {
  //   this.isAuthenticated = true;
  //   localStorage.setItem('isAuthenticated', 'true');
  //   this.errorMessage = '';
  //   // Navigate to dashboard after successful login
  //   this.router.navigate(['/users']);
  //   // this.toastService.show('Login successful!', 'success');
  //   this.messageService.add({
  //       severity: 'success',
  //       summary: 'Login successful',
  //       detail: 'Welcome back!'
  //     });
  // } else {
  //   // this.errorMessage = 'Invalid credentials';
  //   // this.toastService.show('Invalid credentials', 'error');
  //    this.messageService.add({
  //       severity: 'error',
  //       summary: 'Login failed',
  //       detail: 'Invalid credentials'
  //     });
  // }
}

logout() {
  this.isAuthenticated = false;
  localStorage.removeItem('isAuthenticated');
  this.username = '';
  this.password = '';
  // Navigate to login route after logout
  this.router.navigate(['/login']);
  // this.toastService.show('Logged out successfully.', 'success');
  this.messageService.add({
      severity: 'info',
      summary: 'Logout successful',
      detail: 'You have been logged out.'
    });
}
}