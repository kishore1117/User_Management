import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
export class UserListComponent implements OnInit, OnDestroy {
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

  private destroy$ = new Subject<void>();

  constructor(private userService: UserService, private router: Router) { }

  ngOnInit() {
    // Load users
    this.userService.getAllUsers().subscribe((data: any) => {
      this.users = data.users;

      this.prepareDepartments();
      this.prepareStatuses();
      this.prepareCategories();
      this.prepareLocations();

      // Load saved filter state and apply filters
      this.restoreFilterState();

      this.loading = false;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Restore filter state from service
  restoreFilterState() {
    const savedFilters = this.userService.getFilterState();
    
    this.selectedDepartments = savedFilters.selectedDepartments || [];
    this.selectedStatus = savedFilters.selectedStatus || '';
    this.selectedCategory = savedFilters.selectedCategory || '';
    this.selectedLocation = savedFilters.selectedLocation || '';

    // Apply all filters
    this.applyAllFilters();
  }

  // Apply all active filters
  applyAllFilters() {
    this.filteredUsers = [...this.users];

    // Apply department filter
    if (this.selectedDepartments && this.selectedDepartments.length > 0) {
      const selectedValues = this.selectedDepartments.map((d: any) => d.value);
      this.filteredUsers = this.filteredUsers.filter((user) =>
        selectedValues.includes(user.department_name)
      );
    }

    // Apply status filter
    if (this.selectedStatus) {
      this.filteredUsers = this.filteredUsers.filter(
        (user) => this.getStatus(user) === this.selectedStatus
      );
    }

    // Apply category filter
    if (this.selectedCategory) {
      this.filteredUsers = this.filteredUsers.filter(
        (user) => user.category_name === this.selectedCategory
      );
    }

    // Apply location filter
    if (this.selectedLocation) {
      this.filteredUsers = this.filteredUsers.filter(
        (user) => user.location_name === this.selectedLocation
      );
    }

    // Save filter state to service
    this.userService.saveFilterState({
      selectedDepartments: this.selectedDepartments,
      selectedStatus: this.selectedStatus,
      selectedCategory: this.selectedCategory,
      selectedLocation: this.selectedLocation
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
    this.selectedDepartments = selectedDepartments || [];
    this.applyAllFilters();
  }

  filterByStatus(status: string) {
    this.selectedStatus = status || '';
    this.applyAllFilters();
  }

  filterByCategory(category: string) {
    this.selectedCategory = category || '';
    this.applyAllFilters();
  }

  filterByLocation(location: string) {
    this.selectedLocation = location || '';
    this.applyAllFilters();
  }

  clearFilter() {
    this.selectedStatus = '';
    this.selectedDepartments = [];
    this.selectedCategory = '';
    this.selectedLocation = '';
    this.userService.clearFilterState();
    this.filteredUsers = [...this.users];
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

