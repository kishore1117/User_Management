import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { ToastService } from '../../services/toastMessage.service';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
export class UserFormComponent implements OnInit {

  user: any = {
    name: '',
    hostname: '',
    ipAddress: '',
    department: '',
    location_id: null
  };

  locations: any[] = [];

  constructor(
    private http: HttpClient,
     private messageService: MessageService,
     private router: Router
  ) {}

  ngOnInit() {
    this.loadLocations();
  }

  loadLocations() {
    this.http.get<any>('http://localhost:3000/api/locations/allowed')
      .subscribe({
        next: (res) => {
          this.locations = res.data || [];

          // auto-select if only one location
          if (this.locations.length === 1) {
            this.user.location_id = this.locations[0].id;
          }
        },
        error: () => {
          this.messageService.add({ severity:'error', summary:'Error', detail:'Failed to load locations' });
        }
      });
  }

  addUser() {
    this.http.post(
      'http://localhost:3000/api/users/create',
      this.user
    ).subscribe({
      next: () => {
        this.messageService.add({ severity:'success', summary:'Success', detail:'User added successfully' });
        this.router.navigate(['/users']);
        this.clearForm();
      },
      error: (error) => {
        this.messageService.add({ severity:'error', summary:'Error', detail: error.error?.message || 'Failed to add user' });
      }
    });
  }

  clearForm() {
    this.user = {
      name: '',
      hostname: '',
      ipAddress: '',
      department: '',
      location_id: null
    };
  }
}

