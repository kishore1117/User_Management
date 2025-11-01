import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { ToastService } from '../../services/toastMessage.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css'],
  animations: [
    trigger('fade', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('hidden <=> visible', [animate('400ms ease-in-out')]),
    ]),
  ],
})
export class UserFormComponent {
  user = { name: '', hostname: '', ipAddress: '', department: '' };
  departments = ['IT', 'Finance', 'HR','Pharma','Cidis','Skinnova','Herbal','YVO','Sales admin','Data analysis','Regulatory'];

  message = '';
  messageType: 'success' | 'error' | null = null;
  fadeState: 'visible' | 'hidden' = 'hidden';

  constructor(private http: HttpClient, private toastService: ToastService) {}
  clearForm() {
    this.user = { name: '', hostname: '', ipAddress: '', department: '' };
  }

  addUser() {
    this.http.post('http://192.168.1.247:3000/api/users', this.user).subscribe({
      next: () => {
        this.toastService.show('User added successfully!', 'success');
        this.clearForm();
      },
      error: (error) =>{
        const errorMessage = error.error?.message || 'Failed to add user. Please try again.';
      this.toastService.show(errorMessage, 'error');
      } 
    });
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    this.fadeState = 'visible';
    setTimeout(() => (this.fadeState = 'hidden'), 2500);
  }
}
