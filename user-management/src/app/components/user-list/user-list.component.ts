
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ["./user-list.component.css"],
  standalone: true,
  imports: [
    TableModule,
    IconFieldModule,
    InputIconModule,
    ProgressSpinnerModule,
    MultiSelectModule,
    SelectModule,
    InputTextModule,
    ButtonModule,
    FormsModule,
    TagModule,
    CommonModule
  ],
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  loading = true;

  // Department dropdown options
  departments: any[] = [];

  // Selected departments
  selectedDepartments: any[] = [];

  // Status filters
  ipStatuses: any[] = [];
  Categorys: any[] = [];
  locations: any[] = [];
  selectedStatus = '';
  selectedCategory = '';
  selectedLocation = '';

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit() {
    this.userService.getAllUsers().subscribe((data: any) => {
      this.users = data.users;
      this.filteredUsers = [...data.users];

      this.prepareDepartments();
      this.prepareStatuses();
      this.prepareCategories();
      this.prepareLocations();

      this.loading = false;
    });
  }

  prepareDepartments() {
    const unique = new Set<string>();

    this.users.forEach((user) => {
      if (user.department_name) {
        unique.add(user.department_name);
      }
    });

    this.departments = Array.from(unique).map((d) => ({
      label: d,
      value: d,
    }));
  }
  addUser() {
    this.router.navigate(['/add']);
  }

  uploadUsers() {
    this.router.navigate(['/upload']);
  }

  exportUsers() {
    this.userService.exportUsers().subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users_export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  prepareStatuses() {
    // Always include both status options
    this.ipStatuses = [
      { label: 'Available IP', value: 'Available IP' },
      { label: 'Reserved IP', value: 'Reserved IP' }
    ];
  }

  prepareCategories() {
    const unique = new Set<string>();

    this.users.forEach((user) => {
      if (user.category_name) {
        unique.add(user.category_name);
      }
    });

    this.Categorys = Array.from(unique).map((c) => ({
      label: c,
      value: c,
    }));
  }

  prepareLocations() {
    const unique = new Set<string>();

    this.users.forEach((user) => {
      if (user.location_name) {
        unique.add(user.location_name);
      }
    });

    this.locations = Array.from(unique).map((l) => ({
      label: l,
      value: l,
    }));
  }

  filterByDepartment(selectedDepartments: any[]) {
    if (!selectedDepartments || selectedDepartments.length === 0) {
      this.filteredUsers = [...this.users];
      return;
    }

    const selectedValues = selectedDepartments.map((d) => d.value);

    this.filteredUsers = this.users.filter((user) =>
      selectedValues.includes(user.department_name)
    );

  }

  filterByStatus(status: string) {
    if (!status) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.users.filter(
      (user) => this.getStatus(user) === status
    );

    this.users = this.filteredUsers;
  }

  filterByCategory(category: string) {
    if (!category) {
      this.filteredUsers = [...this.users];
      return;
    }
    this.filteredUsers = this.users.filter(
      (user) => user.category_name === category
    );
    this.users = this.filteredUsers;
  }

  filterByLocation(location: string) {
    if (!location) {
      this.filteredUsers = [...this.users];
      return;
    }
    this.filteredUsers = this.users.filter(
      (user) => user.location_name === location
    );
    this.users = this.filteredUsers;
  }

  clearFilter() {
    this.selectedStatus = '';
    this.selectedDepartments = [];
    this.selectedCategory = '';
    this.selectedLocation = '';
    this.ngOnInit(); // Re-initialize to fetch all users again
  }

  getStatus(user: any) {
  return /^n\/?a$/i.test(user?.name ?? '')
    ? 'Available IP'
    : 'Reserved IP';
}

  getSeverity(status: string) {
    return status === 'Available IP' ? 'success' : 'danger';
  }

  viewUser(id: number) {
    this.router.navigate(['/user', id]);
  }
}

