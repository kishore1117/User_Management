import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-forget-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.css'
})
export class ForgetPasswordComponent {
  email = '';
  isInitialLoad = true;

  constructor(private router: Router, private userService: UserService, private messageService: MessageService) {
  }

  validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  disableSubmit(): boolean {
    return !this.email || !this.validateEmail(this.email);
  }

  onInputChange() {
    this.isInitialLoad = false;
  }
  sendResetLink() {
    // Implement logic to send reset link to the provided email
    this.userService.sendPasswordResetEmail(this.email).subscribe(
      response => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Reset link sent to your email.' });
        this.email = ''; // Clear the email input after sending the reset link
        setTimeout(() => {
          this.router.navigate(['/']); // or '/login'
        }, 1000);// Redirect to login page after successful reset
      },
      error => {
        console.log('Password reset error:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail:  error.error?.message || 'An error occurred while sending the reset link. Please try again later.' });
        this.email = ''; 
             setTimeout(() => {
      this.router.navigate(['/']); // or '/login'
    }, 1000);/// Clear the email input even if there's an error to allow the user to try again
      }
    );
  }

}
