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
   status?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  baseUrl = 'http://localhost:3000/api/users';
  users: User[] = [];
  filteredUsers: User[] = [];
  showDeleteModal = false;
  selectedUserToDelete: any = null;
  departments: string[] = ['IT', 'Finance', 'HR', 'Pharma', 'Cidis', 'Skinnova', 'Herbal', 'YVO', 'Sales admin', 'Data analysis', 'Regulatory'];
  selectedDepartment: string = '';
  loading: boolean = true;
  selectedUser: User | null = null;
  editingId: number | null = null;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private http: HttpClient,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.loadUsers();
  }

  openDeleteModal(user: any) {
    this.selectedUserToDelete = user;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    const userId = this.selectedUserToDelete.id;

    this.http.delete(`http://localhost:3000/api/users/${userId}`).subscribe({
      next: () => {
        this.filteredUsers = this.filteredUsers.filter(u => u.id !== userId);
        this.showDeleteModal = false;
        this.selectedUserToDelete = null;
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        this.showDeleteModal = false;
      }
    });
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.selectedUserToDelete = null;
  }


//   loadUsers() {
//   this.loading = true;
//   this.http.get<User[]>(`${this.baseUrl}`).subscribe({
//     next: (users) => {
//       // ✅ Normalize fields to remove accidental spaces
//       this.users = users.map(u => ({
//         ...u,
//         name: u.name?.trim(),
//         hostname: u.hostname?.trim(),
//         ip_address: u.ip_address?.trim(),
//         department: u.department?.trim()
//       }));

//       // ✅ Extract unique, non-empty departments dynamically
//       const departmentSet = new Set<string>();
//       this.users.forEach(user => {
//         if (user.department && user.department !== '') {
//           departmentSet.add(user.department);
//         }
//       });
//       this.departments = Array.from(departmentSet).sort();

//       // ✅ Apply sorting and filtering after load
//       this.filteredUsers = [...this.users];
//       this.applySorting();

//       this.loading = false;
//     },
//     error: (err) => {
//       console.error('Failed to load users:', err);
//       this.loading = false;
//     }
//   });
// }

loadUsers() {
  this.loading = true;
  this.http.get<User[]>(`${this.baseUrl}`).subscribe({
    next: (users) => {
      this.users = users.map(u => {
        const trimmed = {
          ...u,
          name: u.name?.trim() || '',
          hostname: u.hostname?.trim() || '',
          ip_address: u.ip_address?.trim() || '',
          department: u.department?.trim() || ''
        };

        // ✅ Add status property dynamically
        const isAvailable =
          (!trimmed.name || trimmed.name.toLowerCase() === 'na') &&
          (!trimmed.hostname || trimmed.hostname.toLowerCase() === 'na') &&
          (!trimmed.department || trimmed.department.toLowerCase() === 'na');

        return {
          ...trimmed,
          status: isAvailable ? 'Available' : 'Taken'
        };
      });

      // ✅ Extract unique departments
      const departmentSet = new Set<string>();
      this.users.forEach(user => {
        if (user.department && user.department !== '') {
          departmentSet.add(user.department);
        }
      });
      this.departments = Array.from(departmentSet).sort();

      // ✅ Filter + Sort
      this.filteredUsers = [...this.users];
      this.applySorting();

      this.loading = false;
    },
    error: (err) => {
      console.error('Failed to load users:', err);
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
    this.http.put<User>(`${this.baseUrl}/${id}`, this.selectedUser).subscribe({
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
    this.http.delete(`${this.baseUrl}/${id}`).subscribe({
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

  // filterByDepartment() {
  //   if (!this.selectedDepartment) {
  //     this.filteredUsers = this.users;
  //   } else {
  //     this.filteredUsers = this.users.filter(
  //       user => user.department === this.selectedDepartment
  //     );
  //   }
  // }

    filterByDepartment() {
    if (this.selectedDepartment) {
      this.filteredUsers = this.users.filter(
        (u) => u.department === this.selectedDepartment
      );
    } else {
      this.filteredUsers = this.users;
    }
  }

  clearFilter() {
    this.selectedDepartment = '';
    this.filteredUsers = this.users;
  }


  sortBy(column: string) {
    // Toggle direction if same column is clicked
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.applySorting();
  }

  applySorting() {
    if (!this.sortColumn) return;

    this.filteredUsers.sort((a, b) => {
      const col = this.sortColumn as keyof User;

      // 🧩 Special handling for IP address
      if (col === 'ip_address') {
        const getLastOctet = (ip: string): number => {
          if (!ip) return 0;
          const parts = ip.trim().split('.');
          const last = parts[parts.length - 1];
          return parseInt(last, 10) || 0;
        };

        const lastA = getLastOctet(a[col] as unknown as string);
        const lastB = getLastOctet(b[col] as unknown as string);

        if (lastA < lastB) return this.sortDirection === 'asc' ? -1 : 1;
        if (lastA > lastB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      // 🔤 Default sorting for all other columns (trim + lowercase)
      const valueA = (a[col]?.toString().trim().toLowerCase()) || '';
      const valueB = (b[col]?.toString().trim().toLowerCase()) || '';

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

}