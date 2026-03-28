import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-resetpage',
  imports: [CommonModule, FormsModule],
  templateUrl: './resetpage.component.html',
  styleUrl: './resetpage.component.css'
})


export class ResetpageComponent {

token: string | null = null;
userId: string | null = null;
password = '';
confirmPassword = '';
isInitialLoad = true;

constructor(private router: Router,private route: ActivatedRoute, private userService: UserService, private messageService: MessageService) {}

ngOnInit() {
  this.token = this.route.snapshot.queryParamMap.get('token');
  this.userId = this.route.snapshot.queryParamMap.get('id');
}

disableSubmit(): boolean {
  if (this.isInitialLoad) return true;

  return !this.password || 
         !this.confirmPassword || 
         this.password !== this.confirmPassword;
}

onInputChange() {
  this.isInitialLoad = false;
}

resetPassword() {
  if (!this.token || !this.userId) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid password reset link.' });
         setTimeout(() => {
      this.router.navigate(['/']); // or '/login'
    }, 1000);
    return;
  }

  this.userService.resetPassword(this.token, this.userId, this.password).subscribe(
    response => {
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Your password has been reset successfully.' });
      this.password = '';
      this.confirmPassword = '';
     setTimeout(() => {
      this.router.navigate(['/']); // or '/login'
    }, 1000);// Redirect to login page after successful reset
    },
    error => {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'An error occurred while resetting your password. Please try again later.' });
      this.password = '';
      this.confirmPassword = '';
           setTimeout(() => {
      this.router.navigate(['/']); // or '/login'
    }, 1000);
    }
  );
}

}
