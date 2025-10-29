import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ToastService } from './services/toastMessage.service';
import { ToastComponent } from './components/toat-message/toat-message.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterOutlet, ToastComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isAuthenticated = false;
  username = '';
  password = '';
  errorMessage = '';

  constructor(private router: Router, private toastService: ToastService) {}

login() {
  if (this.username === 'admin' && this.password === 'apex@123') {
    this.isAuthenticated = true;
    localStorage.setItem('isAuthenticated', 'true');
    this.errorMessage = '';
    // Navigate to dashboard after successful login
    this.router.navigate(['/dashboard']);
    this.toastService.show('Login successful!', 'success');
  } else {
    this.errorMessage = 'Invalid credentials';
    this.toastService.show('Invalid credentials', 'error');
  }
}

logout() {
  this.isAuthenticated = false;
  localStorage.removeItem('isAuthenticated');
  this.username = '';
  this.password = '';
  // Navigate to login route after logout
  this.router.navigate(['/login']);
  this.toastService.show('Logged out successfully.', 'success');
}
}