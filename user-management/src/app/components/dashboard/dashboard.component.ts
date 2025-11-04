import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ToastService } from '../../services/toastMessage.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

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
  selectedStatus: string = '';
  statuses: string[] = ['Reserved IP', 'Available IP'];
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

  // loadUsers() {
  //   this.loading = true;

  //   this.http.get<User[]>(`${this.baseUrl}`).subscribe({
  //     next: (users) => {
  //       this.users = users.map((u) => {
  //         // Trim all values
  //         const trimmed = {
  //           ...u,
  //           name: u.name?.trim() || '',
  //           hostname: u.hostname?.trim() || '',
  //           ip_address: u.ip_address?.trim() || '',
  //           department: u.department?.trim() || ''
  //         };

  //         // Determine if IP is available
  //         const isAvailable =
  //           (!trimmed.name || trimmed.name.toLowerCase() === 'na') &&
  //           (!trimmed.hostname || trimmed.hostname.toLowerCase() === 'na');

  //         return {
  //           ...trimmed,
  //           status: isAvailable ? 'Available IP' : 'Reserved IP'
  //         };
  //       });

  //       // ✅ Build department list (including "NA")
  //       const departmentSet = new Set<string>();
  //       this.users.forEach(user => {
  //         const dept =
  //           user.department && user.department.trim() !== ''
  //             ? user.department
  //             : 'NA'; // 👈 include NA for empty departments
  //         departmentSet.add(dept);
  //       });

  //       this.departments = Array.from(departmentSet).sort((a, b) =>
  //         a.localeCompare(b)
  //       );

  //       // ✅ Apply sorting and filtering
  //       this.filteredUsers = [...this.users];
  //       this.applySorting();

  //       // ✅ Initialize charts after data load
  //       this.initCharts();

  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error('❌ Failed to load users:', err);
  //       this.loading = false;
  //     }
  //   });
  // }
loadUsers() {
  this.loading = true;

  this.http.get<User[]>(`${this.baseUrl}`).subscribe({
    next: (users) => {
      this.users = users.map((u) => {
        // Normalize and trim all string fields
        const trimmed = {
          ...u,
          name: u.name?.trim() || '',
          hostname: u.hostname?.trim() || '',
          ip_address: u.ip_address?.trim() || '',
          department: u.department?.trim() || ''
        };

        // Compute availability based on name + hostname
        const isAvailable =
          (!trimmed.name || trimmed.name.toLowerCase() === 'na') &&
          (!trimmed.hostname || trimmed.hostname.toLowerCase() === 'na');

        return {
          ...trimmed,
          status: isAvailable ? 'Available IP' : 'Reserved IP'
        };
      });

      // ✅ Extract unique department names (including 'NA' for unassigned)
      this.departments = Array.from(
        new Set(
          this.users.map(u => u.department || 'NA')
        )
      )
      .filter((dept): dept is string => !!dept)
      .sort((a, b) => a.localeCompare(b));

      // ✅ Extract unique statuses
      this.statuses = Array.from(
        new Set(
          this.users
            .map(u => u.status)
            .filter((status): status is string => !!status)
        )
      ).sort((a, b) => a.localeCompare(b));

      // ✅ Apply sorting, filtering, and initialize charts
      this.filteredUsers = [...this.users];
      this.applySorting();
      this.initCharts();

      this.loading = false;
    },
    error: (err) => {
      console.error('❌ Failed to load users:', err);
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

    // ✅ Trim and normalize fields
    const updatedUser = {
      ...this.selectedUser,
      name: this.selectedUser.name?.trim() || '',
      hostname: this.selectedUser.hostname?.trim() || '',
      ip_address: this.selectedUser.ip_address?.trim() || '',
      department: this.selectedUser.department?.trim() || ''
    };

    const isAvailable =
      (!updatedUser.name || updatedUser.name.toLowerCase() === 'na') &&
      (!updatedUser.hostname || updatedUser.hostname.toLowerCase() === 'na');

    updatedUser.status = isAvailable ? 'Available IP' : 'Reserved IP';

    this.http.put<User>(`${this.baseUrl}/${id}`, updatedUser).subscribe({
      next: () => {
        this.users = this.users.map(u => (u.id === id ? { ...updatedUser } : u));
        this.filteredUsers = [...this.users];
        this.applySorting();
        this.filterByDepartment();
        this.departments = [...new Set(
          this.users.map(user => user.department?.trim() || 'NA')
        )].sort((a, b) => a.localeCompare(b));
        this.editingId = null;
        this.initCharts();
        this.selectedUser = null;
        this.editingId = null; // 👈 This disables input fields in UI
        // ✅ Success message
        this.toastService.show('User updated successfully!', 'success');
      },
      error: () => {
        this.toastService.show('Failed to update user.', 'error');
      }
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


  filterByDepartment() {
    this.filteredUsers = this.users.filter(user => {
    const departmentMatch =
      !this.selectedDepartment ||
      user.department === this.selectedDepartment ||
      (this.selectedDepartment === 'NA' && !user.department);

    const statusMatch =
      !this.selectedStatus ||
      user.status === this.selectedStatus;

    return departmentMatch && statusMatch;
  });

  this.applySorting();
  }

  clearFilter() {
    this.selectedDepartment = '';
    this.selectedStatus = '';
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

  initCharts() {
    this.renderDepartmentPie();
    this.renderStatusBar();
  }

  renderDepartmentPie() {
    const deptCount: any = {};
    this.users.forEach(u => {
      deptCount[u.department] = (deptCount[u.department] || 0) + 1;
    });

    new Chart('deptPieChart', {
      type: 'pie',
      data: {
        labels: Object.keys(deptCount),
        datasets: [{
          data: Object.values(deptCount),
          backgroundColor: ['#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#1abc9c']
        }]
      }
    });
  }

  renderStatusBar() {
    const reserved = this.users.filter(u => u.status === 'Reserved IP').length;
    const available = this.users.filter(u => u.status === 'Available IP').length;

    new Chart('ipStatusBarChart', {
      type: 'bar',
      data: {
        labels: ['Reserved', 'Available IP'],
        datasets: [{
          label: 'IP Usage',
          data: [reserved, available],
          backgroundColor: ['#e74c3c', '#2ecc71']
        }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });
  }

}