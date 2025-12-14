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


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TableModule, InputTextModule, FormsModule, ReactiveFormsModule, TabsModule, ProgressSpinnerModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  providers: [MessageService]
})
export class AdminComponent implements OnInit {
  loading = false;

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
  userColumns: any[] = []; // columns for users table

  // lookup arrays for selects (if you need them)
  departments: any[] = [];
  divisions: any[] = [];
  locations: any[] = [];
  categories: any[] = [];

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
    // initialize empty forms
    this.lookupForm = this.fb.group({});
    this.userForm = this.fb.group({});
  }

  // --- SECTION SELECTION ---
  setActiveSection(section: 'lookup' | 'users') {
    // toggle: clicking an already-active section will clear selection (show both panels)
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
        // this.tableColumns = rawCols.map((c: any) => {
        //   const name = c.column_name || c.name || c.column || '';
        //   return {
        //     name,
        //     type: c.data_type || c.type || 'text',
        //     nullable: (typeof c.is_nullable === 'string') ? (c.is_nullable === 'YES') : (typeof c.nullable === 'boolean' ? c.nullable : true),
        //     default: c.column_default || c.default,
        //     isPrimary: !!(c.column_name === 'id' || c.isPrimary || c.primary_key || (c.column_default && String(c.column_default).startsWith('nextval')))
        //   };
        // });

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
      if (t.includes('int') || t.includes('numeric') || t.includes('decimal')) initial = null;
      else if (t.includes('bool')) initial = false;

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
    if (this.lookupForm.get(this.lookupPrimaryKey)) this.lookupForm.get(this.lookupPrimaryKey)!.disable();
    this.lookupForm.patchValue(row || {});
    setTimeout(() => document.getElementById('lookup-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  submitLookup() {
    if (!this.lookupForm) return;
    if (this.lookupForm.invalid) {
      this.lookupForm.markAllAsTouched();
      return;
    }
    const raw = this.lookupForm.getRawValue ? this.lookupForm.getRawValue() : {};
    const payload = { ...raw };
    console.log(payload)
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
        this.editingUser = true;

        // rows normalization - support different shapes returned by getAllUsers()
        if (!rows) this.users = [];
        else if (Array.isArray(rows)) this.users = rows;
        else if (rows.success && Array.isArray(rows.users)) {
          this.users = Array.isArray(rows.users) ? rows.users : (rows.users.rows || []);
        } else if (rows.users && Array.isArray(rows.users)) this.users = rows.users;
        else if (rows.rows && Array.isArray(rows.rows)) this.users = rows.rows;
        else this.users = rows.users || rows.data || [];

        // build user form from userColumns
        this.buildUserFormFromColumns();
        // optionally fetch lookup lists for selects
        this.userService.getLookupData().subscribe({
          next: (lk: any) => {
            const data = lk?.data || lk || {};
            this.departments = data.departments || [];
            this.locations = data.locations || [];
            this.divisions = data.divisions || [];
            this.categories = data.categories || [];
          },
          error: () => { }
        });

        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Load failed', detail: 'Could not load users or user schema' });
      }
    });
  }
  viewUser(user: any) { }

  private buildUserFormFromColumns() {
    const group: any = {};
    // create controls for common user columns only (avoid sensitive or computed columns)
    const ignored = new Set(['created_at', 'updated_at', 'id', 'password_hash']);
    this.userColumns.forEach(col => {
      if (ignored.has(col.name)) return;
      const validators = [];
      if (!col.nullable && !col.isPrimary) validators.push(Validators.required);
      const t = String(col.type || '').toLowerCase();
      let initial: any = '';
      if (t.includes('int') || t.includes('numeric') || t.includes('decimal')) initial = null;
      else if (t.includes('bool')) initial = false;
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
    // patch form with user's values for matching field names
    const patch: any = {};
    Object.keys(this.userForm.controls).forEach(k => {
      // try several candidate properties on user object
      patch[k] = user[k] ?? user[this.camelToSnake(k)] ?? user[this.snakeToCamel(k)] ?? user[k];
    });
    this.userForm.patchValue(patch);
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
    if (payload.location_ids && Array.isArray(payload.location_ids)) {
      payload.location_ids = payload.location_ids.join(",");
    }
    const convertpayload = (input: any) => {
      console.log('Converting payload:', input);
      return {
        username: input.username,
        role: input.role,
        location_ids: input.location_ids.split(",").map(Number),
        password: input.password
      }
    }
    if (this.editingUser && this.editingUserId) {
      const convertedPayload = convertpayload(payload);
      this.userService.updateUserAccess(this.editingUserId, convertedPayload).subscribe({
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
      const convertpayload = (input: any) => {
        return {
          username: input.username,
          role: input.role,
          location_ids: input.location_ids.split(",").map(Number),
          password: input.password
        }
      }
      const convertedPayload = convertpayload(payload);
      this.userService.addUserAccess(convertedPayload).subscribe({
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