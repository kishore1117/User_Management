import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgModel } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { ToastService } from '../../services/toastMessage.service';

interface User {
  id?: number;
  name: string;
  hostname: string;
  ip_address: string;
  department: string;
}

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './user-search.component.html',
  styleUrls: ['./user-search.component.css'],
  animations: [
    trigger('fade', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('hidden <=> visible', [animate('400ms ease-in-out')]),
    ]),
  ],
})
export class UserSearchComponent {
  errorMessage = '';
  search = { name: '', hostname: '', ipAddress: '' };
  users: User[] = [];
  selectedUser: User | null = null;
  editingId: number | null = null;
  hideResults = false;

  departments = ['IT', 'Finance', 'HR','Pharma','Cidis','Skinnova','Herbal','YVO','Sales admin','Data analysis','Regulatory'];

  toastMessage = '';
  messageType: 'success' | 'error' | null = null;
  fadeState: 'visible' | 'hidden' = 'hidden';

  private baseUrl = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient, private toastService: ToastService) {}

     isFormValid(search: any, ipInput: NgModel): boolean {
    const { name, hostname, ipAddress } = search;

    // Case 1: All fields empty → invalid
    if (!name && !hostname && !ipAddress) return false;

    // Case 2: IP entered but invalid pattern → invalid
    if (ipAddress && ipInput.invalid) return false;

    // ✅ Otherwise → valid
    return true;
  }
  searchUsers() {
    this.errorMessage = '';
    const body: any = {};

     this.hideResults = false;
    if (this.search.name?.trim()) body.name = this.search.name.trim();
    if (this.search.hostname?.trim()) body.hostname = this.search.hostname.trim();
    if (this.search.ipAddress?.trim()) body.ipAddress = this.search.ipAddress.trim();

    this.http.post<User[]>(`${this.baseUrl}/search`, body).subscribe({
      next: (res) => {
        this.users = res || [];
        this.toastService.show(`Found ${this.users.length} user(s).`, 'success');
        this.clearSearch();
      },
      error: () => this.toastService.show('Failed to fetch users. Please try again.', 'error'),
    });
  }

  hideResultsSection(){
    this.hideResults = true;
    this.clearSearch();
  }

  editUser(user: User) {
    if (!user.id) return;
    this.selectedUser = { ...user };
    this.editingId = user.id;
  }
    clearSearch() {
    this.search = { name: '', hostname: '', ipAddress: '' };
  }

  cancelEdit() {
    this.selectedUser = null;
    this.editingId = null;
  }

 updateUser() {
  if (!this.selectedUser?.id) {
    this.toastService.show('No user selected to update.', 'error');
    return;
  }

  const id = this.selectedUser.id;
  this.http.put<User>(`${this.baseUrl}/${id}`, this.selectedUser).subscribe({
    next: (updatedUser) => {
      // console.log('Updated User:', updatedUser);
      // Remove the old user entry
      this.users = this.users.filter(u => u.id !== id);
      // Append the updated user to the results
      this.users = [...this.users, updatedUser];
      
      // // Clear edit state
      // this.selectedUser = null;
      // this.editingId = null;
      
      // Clear search form
      this.cancelEdit();
      this.clearSearch();

      this.toastService.show('User updated successfully!', 'success');
    },
    error: () => this.toastService.show('Failed to update user. Please try again.', 'error')
  });
}

  deleteUser(id?: number) {
    if (!id) {
      this.toastService.show('Invalid user id.', 'error');
      return;
    }

    this.http.delete(`${this.baseUrl}/${id}`).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== id);
        if (this.selectedUser?.id === id) {
          this.selectedUser = null;
          this.editingId = null;
        }
        this.toastService.show('User deleted successfully.', 'success');
      },
      error: () => this.toastService.show('Failed to delete user. Please try again.', 'error')
    });
  }
}