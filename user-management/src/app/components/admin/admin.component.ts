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


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TableModule, InputTextModule, FormsModule, ReactiveFormsModule, TabsModule, ProgressSpinnerModule, MultiSelectModule],
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
    { label: 'Purchased_from', value: 'purchase_from' },
    { label: 'Software', value: 'software' }
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
          this.locationList = res.data || [];
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
   * Convert location objects back to IDs for API submission
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
      });
    }

    // If it's a comma-separated string
    if (typeof value === 'string') {
      return value.split(',').map(v => Number(v.trim())).filter(id => !isNaN(id));
    }

    // Single value
    return [Number(value)];
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

        const IGNORE_COLUMNS = ['created_at', 'updated_at'];

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

        // rows normalization
        if (rows && Array.isArray((rows as any).rows)) this.tableData = (rows as any).rows;
        else if (Array.isArray(rows)) this.tableData = rows;
        else this.tableData = [];

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

      // Initialize location_ids as empty array for multiSelect
      if (col.name === 'location_ids') {
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

    // Prepare edit data with location_ids conversion
    const editData = { ...row };

    // Convert location_ids to location objects for multiSelect
    if (editData.location_ids) {
      editData.location_ids = this.convertLocationIdsToObjects(editData.location_ids);
    } else {
      editData.location_ids = [];
    }

    // Rebuild the form with the edit data
    const group: any = {};
    this.tableColumns.forEach(col => {
      const validators = [];
      if (!col.nullable && !col.isPrimary) validators.push(Validators.required);

      const t = String(col.type || '').toLowerCase();
      let value: any = editData[col.name] ?? null;

      // Special handling for location_ids - ensure it's an array of objects
      if (col.name === 'location_ids') {
        value = Array.isArray(editData.location_ids) ? editData.location_ids : [];
      }

      if (col.name === this.lookupPrimaryKey) {
        group[col.name] = [{ value: value, disabled: true }];
      } else {
        group[col.name] = [value, validators];
      }
    });

    this.lookupForm = this.fb.group(group);

    console.log('Rebuilt lookup form with values:', this.lookupForm.value);
    console.log('Location_ids field value:', this.lookupForm.get('location_ids')?.value);

    setTimeout(() => document.getElementById('lookup-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
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
      location_ids: this.normalizeLocationIds(raw.location_ids)
    };

    if (!this.lookupEditing) {
      if (this.lookupPrimaryKey in payload) delete payload[this.lookupPrimaryKey];
      this.userService.createTableRecord(this.selectedTable!, payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Record created' });
          this.loadLookupForSelectedTable();
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

        // build user form from userColumns
        this.buildUserFormFromColumns();

        this.loading = false;
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

    // Prepare edit data with location_ids conversion
    const editData = { ...user };

    // Convert location_ids to location objects for multiSelect
    if (editData.location_ids) {
      editData.location_ids = this.convertLocationIdsToObjects(editData.location_ids);
    } else {
      editData.location_ids = [];
    }

    // Rebuild the form with the edit data
    const group: any = {};
    const ignored = new Set(['created_at', 'updated_at', 'id', 'password_hash']);
    this.userColumns.forEach(col => {
      if (ignored.has(col.name)) return;
      const validators = [];
      if (!col.nullable && !col.isPrimary) validators.push(Validators.required);

      let value: any = editData[col.name] ?? null;

      // Special handling for location_ids - ensure it's an array of objects
      if (col.name === 'location_ids') {
        value = Array.isArray(editData.location_ids) ? editData.location_ids : [];
      }

      group[col.name] = [value, validators];
    });

    this.userForm = this.fb.group(group);
    this.userFormVisible = true;

    console.log('Rebuilt user form with values:', this.userForm.value);
    console.log('User location_ids field value:', this.userForm.get('location_ids')?.value);

    setTimeout(() => document.getElementById('user-inline-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
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
}