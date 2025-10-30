import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ToastService } from '../../services/toastMessage.service';

interface User {
  id: number;
  name: string;
  hostname: string;
  ip_address: string;
  department: string;
  created_at: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  departments: string[] = ['IT', 'Finance', 'HR', 'Pharma', 'Cidis', 'Skinnova', 'Herbal', 'YVO', 'Sales admin', 'Data analysis', 'Regulatory'];
  selectedDepartment: string = '';
  loading: boolean = true;
  selectedUser: User | null = null;
  editingId: number | null = null;

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.fetchUsers();
  }

 fetchUsers() {
    this.loading = true;
    this.http.get<User[]>('http://192.168.1.247:3000/api/users').subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        // Extract unique departments from actual user data
        this.departments = [...new Set(users.map(user => user.department))]
          .filter(dept => dept) // Remove empty values
          .sort((a, b) => a.localeCompare(b)); // Sort alphabetically
        this.loading = false;
      },
      error: () => {
        this.toastService.show('Failed to load users', 'error');
        this.loading = false;
      }
    });
  }


  editUser(user: User) {
    this.selectedUser = { ...user };
    this.editingId = user.id;
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
    this.http.put<User>(`http://192.168.1.247:3000/api/users/${id}`, this.selectedUser).subscribe({
      next: (updatedUser) => {
        this.users = this.users.map(u => u.id === id ? updatedUser : u);
        // Refresh departments list in case department was changed
        this.departments = [...new Set(this.users.map(user => user.department))]
          .filter(dept => dept)
          .sort((a, b) => a.localeCompare(b));
        this.filterByDepartment();
        this.selectedUser = null;
        this.editingId = null;
        this.toastService.show('User updated successfully!', 'success');
      },
      error: () => this.toastService.show('Failed to update user.', 'error')
    });
  }

  deleteUser(id: number) {
    this.http.delete(`http://192.168.1.247:3000/api/users/${id}`).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== id);
        this.filterByDepartment(); // Refresh filtered list
        if (this.selectedUser?.id === id) {
          this.selectedUser = null;
          this.editingId = null;
        }
        this.toastService.show('User deleted successfully.', 'success');
      },
      error: () => this.toastService.show('Failed to delete user.', 'error')
    });
  }

  filterByDepartment() {
    if (!this.selectedDepartment) {
      this.filteredUsers = this.users;
    } else {
      this.filteredUsers = this.users.filter(
        user => user.department === this.selectedDepartment
      );
    }
  }

  clearFilter() {
    this.selectedDepartment = '';
    this.filteredUsers = this.users;
  }
}