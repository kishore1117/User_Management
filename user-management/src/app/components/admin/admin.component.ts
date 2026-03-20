import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { UserService } from '../../services/user.service';
import { TabsModule } from 'primeng/tabs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MultiSelectModule } from 'primeng/multiselect';
import { environment } from '../../../environments/environment';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TableModule, InputTextModule, FormsModule, ReactiveFormsModule, TabsModule, ProgressSpinnerModule, MultiSelectModule, SelectModule, ToastModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  providers: [MessageService]
})
export class AdminComponent implements OnInit {
  loading = false;
  activeTabIndex: number = 0;

  // ACTIVE SECTION: 'lookup' | 'users' | null
  activeSection: 'lookup' | 'users' | null = null;

  // Lookup-table admin state
  selectedTable: string | null = null;
  tableColumns: any[] = [];
  tableData: any[] = [];
  tableSearch = '';
  lookupForm!: FormGroup;
  lookupEditing = false;
  lookupEditingId: any = null;
  lookupPrimaryKey = 'id';

  // User management state
  users: any[] = [];
  userSearch = '';
  userForm!: FormGroup;
  userFormVisible = false;
  editingUser = false;
  editingUserId: any = null;
  userColumns: any[] = [];

  // lookup arrays for selects
  departments: any[] = [];
  divisions: any[] = [];
  locations: any[] = [];
  categories: any[] = [];
  locationList: any[] = [];
  departmentList: any[] = [];
  categoryList: any[] = [];
  roleList = [
    { label: 'Admin', value: 'admin' },
    { label: 'User', value: 'user' }
  ];

  tableList = [
    { label: 'Department', value: 'departments' },
    { label: 'Division', value: 'divisions' },
    { label: 'Category', value: 'categories' },
    { label: 'Location', value: 'locations' },
    { label: 'Model', value: 'models' },
    { label: "Processor", value: 'processors' },
    { label: 'Ram', value: "rams" },
    { label: 'Storage', value: "hdds" },
    { label: 'Warranty', value: 'warranties' },
    { label: 'Vendor details', value: 'purchase_from' },
    { label: 'Software', value: 'software' },
    { label: 'Operating System', value: 'operating_systems' },
    { label: 'Monitor', value: 'monitors' },
    { label: 'Keyboard', value: 'keyboards' },
    { label: 'Mouse', value: 'mice' },
    { label: 'CPU Speed', value: 'cpu_speeds' },
    { label: 'Licences', value: 'licences' }
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private userService: UserService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.lookupForm = this.fb.group({});
    this.userForm = this.fb.group({});
    this.loadLocations();
  }

  // Compare function for multiSelect to match location objects by ID
  compareByLocationId = (obj1: any, obj2: any): boolean => {
    if (!obj1 || !obj2) return false;
    return obj1?.id === obj2?.id;
  };

  // Compare function for multiSelect to match department objects by ID
  compareByDepartmentId = (obj1: any, obj2: any): boolean => {
    if (!obj1 || !obj2) return false;
    return obj1?.id === obj2?.id;
  };

  // --- TAB CHANGE HANDLER ---
  onTabChange(newIndex: number) {
    this.activeTabIndex = newIndex;
    console.log('Tab changed to:', newIndex);
    
    if (newIndex === 0) {
      this.setActiveSection('lookup');
    } else if (newIndex === 1) {
      this.setActiveSection('users');
    }
  }

  // --- SECTION SELECTION ---
  setActiveSection(section: 'lookup' | 'users') {
    if (this.activeSection === section) {
      this.activeSection = null;
      return;
    }

    this.activeSection = section;

    if (section === 'lookup') {
      console.log('Selected lookup section');
      if (this.selectedTable) this.loadLookupForSelectedTable();
    } else {
      this.loadUserSection();
    }
  }

  // ---------- LOOKUP: schema + rows, dynamic form ----------
  onLookupTableSelect(tableName: string) {
    this.selectedTable = tableName;
    if (this.activeSection === 'lookup') {
      this.loadLookupForSelectedTable();
    }
  }

  loadLocations() {
    this.http.get<any>(`${environment.apiBaseUrl}/locations/allowed`)
      .subscribe({
        next: (res) => {
          console.log("Locations loaded:", res.data);
          this.locationList = res.locations || [];
          this.departmentList = res.departments || [];
          this.categoryList = res.categories || [];
          console.log("Location List after assignment:", this.locationList);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load locations' });
        }
      });
  }

  /**
   * Convert location IDs to location objects for multiSelect display
   */
  private convertLocationIdsToObjects(locationIds: any): any[] {
    if (!locationIds) return [];

    let ids: number[] = [];

    // Handle string (comma-separated)
    if (typeof locationIds === 'string') {
      ids = locationIds.split(',').map((id: string) => Number(id.trim())).filter(id => !isNaN(id));
    }
    // Handle array
    else if (Array.isArray(locationIds)) {
      ids = locationIds.map((id: any) => Number(id)).filter(id => !isNaN(id));
    }
    // Handle single number
    else if (typeof locationIds === 'number') {
      ids = [locationIds];
    }

    console.log('Converted location IDs:', ids);
    console.log('Available locations:', this.locationList);

    // Convert IDs to location objects
    if (ids.length > 0 && this.locationList && this.locationList.length > 0) {
      const result = this.locationList.filter((loc: any) => ids.includes(loc.id));
      console.log('Result location objects:', result);
      return result;
    }

    return [];
  }

  /**
   * Convert location/department objects back to IDs for API submission
   */
  private normalizeLocationIds(value: any): number[] {
    if (!value) return [];

    // If it's an array, extract IDs
    if (Array.isArray(value)) {
      return value.map(v => {
        // If it's an object with id property (from multiSelect), extract id
        if (typeof v === 'object' && v !== null && v.id) return Number(v.id);
        // Otherwise assume it's already an ID
        return Number(v);
      }).filter(id => !isNaN(id));
    }

    // If it's a comma-separated string
    if (typeof value === 'string') {
      return value.split(',').map(v => Number(v.trim())).filter(id => !isNaN(id));
    }

    // Single value
    if (typeof value === 'object' && value !== null && value.id) {
      return [Number(value.id)];
    }
    return [Number(value)];
  }

  private normalizeDepartmentIds(value: any): number[] {
    return this.normalizeLocationIds(value);
  }

  loadLookupForSelectedTable() {
    console.log('Loading lookup for table:', this.selectedTable);
    if (!this.selectedTable) return;
    this.loading = true;
    forkJoin({
      schema: this.userService.getTableDetails(this.selectedTable!),
      rows: this.userService.getTableRows(this.selectedTable!)
    }).subscribe({
      next: ({ schema, rows }) => {
        const rawCols = Array.isArray(schema) ? schema : (schema && Array.isArray((schema as any).columns) ? (schema as any).columns : []);

        const IGNORE_COLUMNS = ['created_at', 'updated_at','id','description'];

        this.tableColumns = rawCols
          .map((c: any) => {
            const name = c.column_name || c.name || c.column || '';
            return {
              name,
              type: c.data_type || c.type || 'text',
              nullable:
                typeof c.is_nullable === 'string'
                  ? c.is_nullable === 'YES'
                  : typeof c.nullable === 'boolean'
                    ? c.nullable
                    : true,
              default: c.column_default || c.default,
              isPrimary: !!(
                name === 'id' ||
                c.isPrimary ||
                c.primary_key ||
                (c.column_default && String(c.column_default).startsWith('nextval'))
              )
            };
          })
          .filter((col: any) => !IGNORE_COLUMNS.includes(col.name));
           console.log('Table Columns:', this.tableColumns);
        // rows normalization
        if (rows && Array.isArray((rows as any).rows)) this.tableData = (rows as any).rows;
        else if (Array.isArray(rows)) this.tableData = rows;
        else this.tableData = [];

        // Sort data by name or id field
        this.tableData.sort((a: any, b: any) => {
          const aValue = a.name || a.id || '';
          const bValue = b.name || b.id || '';
          return String(aValue).localeCompare(String(bValue));
        });

        this.lookupPrimaryKey = (this.tableColumns.find(c => c.isPrimary) || this.tableColumns.find(c => c.name === 'id') || { name: 'id' }).name;
        this.buildLookupForm();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Load failed', detail: 'Failed to load lookup schema or rows' });
      }
    });
  }

  private buildLookupForm() {
    const group: any = {};
    this.tableColumns.forEach(col => {
      const validators = [];
      if (!col.nullable && !col.isPrimary) validators.push(Validators.required);
      let initial: any = '';
      const t = String(col.type || '').toLowerCase();

      // Initialize location_ids and department_ids as empty arrays for multiSelect
      if (col.name === 'location_ids' || col.name === 'department_ids' || col.name === 'category_ids') {
        initial = [];
      } else if (t.includes('int') || t.includes('numeric') || t.includes('decimal')) {
        initial = null;
      } else if (t.includes('bool')) {
        initial = false;
      }

      if (col.name === this.lookupPrimaryKey) {
        group[col.name] = [{ value: initial, disabled: true }];
      } else {
        group[col.name] = [initial, validators];
      }
    });
    this.lookupForm = this.fb.group(group);
    this.lookupEditing = false;
    this.lookupEditingId = null;
  }

  openLookupAdd() {
    this.lookupEditing = false;
    this.lookupEditingId = null;
    this.buildLookupForm();
    setTimeout(() => document.getElementById('lookup-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  openLookupEdit(row: any) {
    this.lookupEditing = true;
    this.lookupEditingId = row[this.lookupPrimaryKey];

    // Prepare edit data 
    const editData = { ...row };

    console.log('=== OPEN LOOKUP EDIT ===');
    console.log('Row data:', editData);
    console.log('LocationList available:', this.locationList);
    console.log('DepartmentList available:', this.departmentList);

    // Build empty form structure first
    const group: any = {};
    this.tableColumns.forEach(col => {
      const validators = [];
      if (!col.nullable && !col.isPrimary) validators.push(Validators.required);

      // Initialize multiSelect fields as empty arrays
      let initialValue: any = '';
      if (col.name === 'location_ids' || col.name === 'department_ids' || col.name === 'category_ids') {
        initialValue = [];
      }

      if (col.name === this.lookupPrimaryKey) {
        group[col.name] = [{ value: editData[col.name], disabled: true }];
      } else {
        group[col.name] = [initialValue, validators];
      }
    });

    this.lookupForm = this.fb.group(group);

    // Now patch values with a small delay to ensure multiSelect options are rendered
    setTimeout(() => {
      const patchData: any = {};
      
      this.tableColumns.forEach(col => {
        let value: any = editData[col.name] ?? null;

        // Special handling for location_ids and department_ids - convert to location objects
        if ((col.name === 'location_ids' || col.name === 'department_ids' || col.name === 'category_ids') && value) {
          console.log(`\nProcessing ${col.name}:`, value, 'Type:', typeof value);
          let ids: number[] = [];
          
          if (typeof value === 'string') {
            ids = value.split(',').map((id: string) => Number(id.trim())).filter((id: number) => !isNaN(id));
          } else if (Array.isArray(value)) {
            ids = value.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
          } else if (typeof value === 'number') {
            ids = [value];
          }

          console.log(`Extracted IDs for ${col.name}:`, ids);

          // Convert IDs to location/department objects for multiSelect display
          if (col.name === 'location_ids') {
            if (this.locationList && this.locationList.length > 0) {
              value = this.locationList.filter((loc: any) => ids.includes(loc.id));
              console.log('Converted location objects:', value);
            } else {
              console.warn('LocationList is empty or not loaded!');
              value = [];
            }
          } else if (col.name === 'department_ids') {
            if (this.departmentList && this.departmentList.length > 0) {
              value = this.departmentList.filter((dept: any) => ids.includes(dept.id));
              console.log('Converted department objects:', value);
            } 
            
            else {
              console.warn('DepartmentList is empty or not loaded!');
              value = [];
            }
          } else if (col.name === 'category_ids') {
            if (this.categoryList && this.categoryList.length > 0) {
              value = this.categoryList.filter((cat: any) => ids.includes(cat.id));
              console.log('Converted category objects:', value);
            } else {
              console.warn('CategoryList is empty or not loaded!');
              value = [];
            }
          }
        } else if (col.name === 'location_ids' || col.name === 'department_ids' || col.name === 'category_ids') {
          // Ensure these are always arrays even if no value
          value = [];
        }

        patchData[col.name] = value;
      });

      console.log('Patch data:', patchData);
      this.lookupForm.patchValue(patchData);
      console.log('After patch, form value:', this.lookupForm.value);
      console.log('=== END LOOKUP EDIT ===\n');
    }, 100);

    setTimeout(() => document.getElementById('lookup-form')?.scrollIntoView({ behavior: 'smooth' }), 150);
  }

  submitLookup() {
    if (!this.lookupForm) return;
    if (this.lookupForm.invalid) {
      this.lookupForm.markAllAsTouched();
      return;
    }
    const raw = this.lookupForm.getRawValue ? this.lookupForm.getRawValue() : {};

    const payload = {
      ...raw,
      location_ids: this.normalizeLocationIds(raw.location_ids),
      department_ids: this.normalizeDepartmentIds(raw.department_ids),
      category_ids: this.normalizeDepartmentIds(raw.category_ids)
    };

    if (!this.lookupEditing) {
      if (this.lookupPrimaryKey in payload) delete payload[this.lookupPrimaryKey];
      this.userService.createTableRecord(this.selectedTable!, payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Record created' });
          this.loadLookupForSelectedTable();
          this.loadLocations();
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({ severity: 'error', summary: 'Create failed', detail: err?.message || 'Could not create record' });
        }
      });
    } else {
      this.userService.updateTableRecord(this.selectedTable!, this.lookupEditingId, payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Record updated' });
          this.loadLookupForSelectedTable();
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({ severity: 'error', summary: 'Update failed', detail: err?.message || 'Could not update record' });
        }
      });
    }
  }

  deleteLookup(row: any) {
    const id = row[this.lookupPrimaryKey];
    if (!id) return;
    if (!confirm('Delete this record?')) return;
    this.userService.deleteTableRecord(this.selectedTable!, id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Record deleted' });
        this.loadLookupForSelectedTable();
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Delete failed', detail: err?.message || 'Could not delete record' });
      }
    });
  }

  // ---------- USER PANEL: build form from users table columns and rows ----------
  loadUserSection() {
    this.loading = true;
    forkJoin({
      schema: this.userService.getTableDetails('user_access'),
      rows: this.userService.getAllUserAccess()
    }).subscribe({
      next: ({ schema, rows }) => {
        // schema normalization
        const rawCols = Array.isArray(schema) ? schema : (schema && Array.isArray((schema as any).columns) ? (schema as any).columns : []);
        this.userColumns = rawCols.map((c: any) => {
          const name = c.column_name || c.name || c.column || '';
          return {
            name,
            type: c.data_type || c.type || 'text',
            nullable: (typeof c.is_nullable === 'string') ? (c.is_nullable === 'YES') : (typeof c.nullable === 'boolean' ? c.nullable : true),
            default: c.column_default || c.default,
            isPrimary: !!(c.column_name === 'id' || c.isPrimary || c.primary_key || (c.column_default && String(c.column_default).startsWith('nextval')))
          };
        });
        console.log('User Columns:', this.userColumns);

        // rows normalization
        if (!rows) this.users = [];
        else if (Array.isArray(rows)) this.users = rows;
        else if (rows.success && Array.isArray(rows.users)) {
          this.users = Array.isArray(rows.users) ? rows.users : (rows.users.rows || []);
        } else if (rows.users && Array.isArray(rows.users)) this.users = rows.users;
        else if (rows.rows && Array.isArray(rows.rows)) this.users = rows.rows;
        else this.users = rows.users || rows.data || [];

        // Sort users by name field alphabetically
        this.users.sort((a: any, b: any) => {
          const aName = a.name || '';
          const bName = b.name || '';
          return String(aName).localeCompare(String(bName));
        });

        // build user form from userColumns
        this.buildUserFormFromColumns();

        this.loading = false;
        this.loadLocations();
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Load failed', detail: 'Could not load users or user schema' });
      }
    });
  }

  private buildUserFormFromColumns() {
    const group: any = {};
    const ignored = new Set(['created_at', 'updated_at', 'id', 'password_hash']);
    this.userColumns.forEach(col => {
      if (ignored.has(col.name)) return;
      const validators = [];
      if (!col.nullable && !col.isPrimary) validators.push(Validators.required);
      const t = String(col.type || '').toLowerCase();
      let initial: any = '';
      
      // Initialize location_ids as empty array for multiSelect
      if (col.name === 'location_ids') {
        initial = [];
      } else if (t.includes('int') || t.includes('numeric') || t.includes('decimal')) {
        initial = null;
      } else if (t.includes('bool')) {
        initial = false;
      }
      
      group[col.name] = [initial, validators];
    });
    console.log('Building user form with controls:', Object.keys(group));
    this.userForm = this.fb.group(group);
    this.userFormVisible = false;
    this.editingUser = false;
    this.editingUserId = null;
  }

  openUserAddInline() {
    console.log('Opening user add inline form');
    this.userFormVisible = true;
    this.editingUser = false;
    this.editingUserId = null;
    this.buildUserFormFromColumns();
    setTimeout(() => document.getElementById('user-inline-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  openUserEditInline(user: any) {
    this.userFormVisible = true;
    this.editingUser = true;
    this.editingUserId = user.id || user.user_id || user.uid;

    // Prepare edit data 
    const editData = { ...user };

    console.log('=== OPEN USER EDIT INLINE ===');
    console.log('User data:', editData);
    console.log('LocationList available:', this.locationList);

    // Build empty form structure first
    const group: any = {};
    const ignored = new Set(['created_at', 'updated_at', 'id', 'password_hash']);
    this.userColumns.forEach(col => {
      if (ignored.has(col.name)) return;
      const validators = [];
      if (!col.nullable && !col.isPrimary) validators.push(Validators.required);
      
      // Initialize multiSelect fields as empty arrays
      let initialValue: any = '';
      if (col.name === 'location_ids') {
        initialValue = [];
      }
      
      group[col.name] = [initialValue, validators];
    });

    this.userForm = this.fb.group(group);
    this.userFormVisible = true;

    // Now patch values with a small delay to ensure multiSelect options are rendered
    setTimeout(() => {
      const patchData: any = {};

      this.userColumns.forEach(col => {
        if (ignored.has(col.name)) return;
        
        let value: any = editData[col.name] ?? null;

        // Special handling for location_ids - convert to location objects for multiSelect
        if (col.name === 'location_ids' && value) {
          console.log('Processing location_ids:', value);
          let ids: number[] = [];
          if (typeof value === 'string') {
            ids = value.split(',').map((id: string) => Number(id.trim())).filter((id: number) => !isNaN(id));
          } else if (Array.isArray(value)) {
            ids = value.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
          } else if (typeof value === 'number') {
            ids = [value];
          }
          console.log('Extracted IDs:', ids);
          
          if (this.locationList && this.locationList.length > 0) {
            value = this.locationList.filter((loc: any) => ids.includes(loc.id));
            console.log('Converted location objects:', value);
          } else {
            console.warn('LocationList is empty or not loaded!');
            value = [];
          }
        } else if (col.name === 'location_ids') {
          // Ensure location_ids is always an array even if no value
          value = [];
        }

        patchData[col.name] = value;
      });

      console.log('User patch data:', patchData);
      this.userForm.patchValue(patchData);
      console.log('After patch, user form value:', this.userForm.value);
      console.log('=== END USER EDIT INLINE ===\n');
    }, 100);

    setTimeout(() => document.getElementById('user-inline-form')?.scrollIntoView({ behavior: 'smooth' }), 150);
  }

  private camelToSnake(s: string) { return s.replace(/([A-Z])/g, '_$1').toLowerCase(); }
  private snakeToCamel(s: string) { return s.replace(/_([a-z])/g, (g) => g[1].toUpperCase()); }

  submitUserInline() {
    if (!this.userForm) return;
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    const payload = { ...this.userForm.value };
    console.log('Submitting user form, payload:', payload);

    // Normalize location_ids
    if (payload.location_ids) {
      payload.location_ids = this.normalizeLocationIds(payload.location_ids);
    } else {
      payload.location_ids = [];
    }

    if (this.editingUser && this.editingUserId) {
      this.userService.updateUserAccess(this.editingUserId, payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'User updated' });
          this.loadUserSection();
          this.userFormVisible = false;
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({ severity: 'error', summary: 'Update failed', detail: err?.message || 'Could not update user' });
        }
      });
    } else {
      this.userService.addUserAccess(payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'User created' });
          this.loadUserSection();
          this.userFormVisible = false;
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({ severity: 'error', summary: 'Create failed', detail: err?.message || 'Could not create user' });
        }
      });
    }
  }

  deleteUserInline(user: any) {
    const id = user?.id || user?.user_id || user?.uid;
    if (!id) {
      this.messageService.add({ severity: 'error', summary: 'Delete failed', detail: 'Invalid user id' });
      return;
    }
    if (!confirm('Delete this user?')) return;
    this.userService.deleteUserAccess(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'User deleted' });
        this.loadUserSection();
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Delete failed' });
      }
    });
  }

  // SEARCH FILTER METHODS
  getFilteredTableData(): any[] {
    if (!this.tableSearch.trim()) {
      return this.tableData;
    }

    const searchTerm = this.tableSearch.toLowerCase();
    return this.tableData.filter((row: any) => {
      return this.tableColumns.some((col: any) => {
        const cellValue = String(row[col.name] || '').toLowerCase();
        return cellValue.includes(searchTerm);
      });
    });
  }

  getFilteredUsers(): any[] {
    if (!this.userSearch.trim()) {
      return this.users;
    }

    const searchTerm = this.userSearch.toLowerCase();
    return this.users.filter((user: any) => {
      return this.userColumns.some((col: any) => {
        const cellValue = String(user[col.name] || '').toLowerCase();
        return cellValue.includes(searchTerm);
      });
    });
  }

  // GET TABLE LABEL BY VALUE
  getSelectedTableLabel(): string {
    if (!this.selectedTable) return 'Record';
    const table = this.tableList.find(t => t.value === this.selectedTable);
    return table ? table.label : this.selectedTable;
  }
}