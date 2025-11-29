// ...existing code...
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { FormBuilder, FormGroup, FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SplitterModule } from 'primeng/splitter';
import { CheckboxModule } from 'primeng/checkbox';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { MessageService } from 'primeng/api';
import { LocationService } from '../../services/location.service';
import { SoftwareService } from '../../services/software.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ["./user-details.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ScrollPanelModule,
    CardModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    DividerModule,
    TagModule,
    FloatLabelModule,
    SplitterModule,
    CheckboxModule,
    AutoCompleteModule
  ]
})
export class UserDetailsComponent implements OnInit {

  userForm!: FormGroup;
  userId: any;
  isEditing = false;
  user: any = {};
  loading = true;
  locations: any[] = [];
  locationId: any;
  originalUser: any = {};
  locationsName: any[] = [];
  selectedLocation: any;
  allSoftware: any[] = [];
  filteredSoftware: any[] = [];
  softwareOptions: any[] = [];
  selectedSoftware: string[] = [];
  softwareList: any[] = []; // API software list (array of names or objects with .name)
  userSoftware: string[] = []; // selected software names

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router,
    private fb: FormBuilder,
    private messageService: MessageService,
    private locationService: LocationService,
    private softwareService: SoftwareService
  ) { }

  ngOnInit() {
    this.initForm();

    // get userId early
    this.userId = this.route.snapshot.paramMap.get('id');

    // wait for both the software list and the user to load, then initialize formArray once
    forkJoin({
      software: this.softwareService.getAllSoftware(),
      userRes: this.userService.getUserById(this.userId)
    }).subscribe({
      next: ({ software, userRes }) => {
        // normalize software list (array of strings or objects)
        this.softwareList = software || [];
        this.softwareOptions = this.softwareList;

        // normalize user object and selected software
        this.user = (userRes && userRes.user) ? userRes.user : (userRes || {});
        this.userSoftware = Array.isArray(this.user.software) ? [...this.user.software] : [];

        // patch primitive fields
        this.populateForm();

        // now sync formArray controls with master list and user selections
        this.syncSoftwareControls();

        // ensure controls reflect isEditing state (initially disabled)
        this.ensureFormState();

        this.originalUser = JSON.parse(JSON.stringify(this.user));
        this.loading = false;
        this.selectedSoftware = [...(this.user.software || [])];
      },
      error: (err) => {
        console.error('Failed to load data:', err);
        this.loading = false;
      }
    });

    // locations can load independently
    this.locationService.getLocations().subscribe(locations => {
      this.locations = locations;
      this.selectedLocation = this.locations.find(loc => loc.id === this.user?.location_id);
      if (this.selectedLocation) {
        this.userForm.patchValue({ location_name: this.selectedLocation.name });
      }
    });
  }

  private initForm() {
    this.userForm = this.fb.group({
      name: [this.user.name],
      hostname: [this.user.hostname],
      department_name: [this.user.department_name],
      division_name: [this.user.division_name],
      location_name: [this.user.location_name],
      location_id: [this.user.location_id],
      category_name: [this.user.category_name],
      ip_address1: [this.user.ip_address1],
      ip_address2: [this.user.ip_address2],
      model: [this.user.model],
      cpu_serial: [this.user.cpu_serial],
      processor: [this.user.processor],
      cpu_speed: [this.user.cpu_speed],
      ram: [this.user.ram],
      hdd: [this.user.hdd],
      monitor: [this.user.monitor],
      monitor_serial: [this.user.monitor_serial],
      keyboard: [this.user.keyboard],
      mouse: [this.user.mouse],
      cd_dvd: [this.user.cd_dvd],
      os: [this.user.os],
      software: this.fb.array([]), // initialize empty; will be synced after data loads
    });
    // keep the whole form disabled until user clicks Edit
    this.userForm.disable();
  }

  // keep the FormArray in sync with softwareList and userSoftware
  private syncSoftwareControls() {
    const formArray = this.softwareFormArray;
    if (!formArray) return;
    formArray.clear();

    for (const sw of this.softwareList) {
      const name = typeof sw === 'string' ? sw : (sw.name || '');
      const isChecked = this.userSoftware.includes(name);
      formArray.push(this.fb.control(isChecked));
    }

    // ensure controls' enabled/disabled state matches isEditing
    this.ensureFormState();
  }

  // enable/disable software controls (and entire form) based on isEditing
  private ensureFormState() {
    const enabled = !!this.isEditing;
    // enable/disable entire form (primitive fields)
    if (enabled) {
      this.userForm.enable({ emitEvent: false });
    } else {
      this.userForm.disable({ emitEvent: false });
    }

    // ensure each software checkbox control has correct disabled state
    const arr = this.softwareFormArray;
    if (!arr) return;
    arr.controls.forEach(ctrl => {
      if (enabled) ctrl.enable({ emitEvent: false }); else ctrl.disable({ emitEvent: false });
    });
  }

  get softwareFormArray(): FormArray {
    return this.userForm.get('software') as FormArray;
  }

  // called when any checkbox changes (template uses (onChange)="onSoftwareCheckboxChange()")
  onSoftwareCheckboxChange() {
    const selected = this.softwareFormArray.controls
      .map((ctrl, i) => ctrl.value ? (typeof this.softwareList[i] === 'string' ? this.softwareList[i] : this.softwareList[i].name) : null)
      .filter(v => v !== null) as string[];

    this.userSoftware = selected;
    // keep selectedSoftware in sync if used elsewhere
    this.selectedSoftware = [...this.userSoftware];
  }

  // convenience helpers to add/remove programmatically (also updates FormArray)
  addSoftware(name: string) {
    if (!name) return;
    if (!this.userSoftware.includes(name)) {
      this.userSoftware.push(name);
    }
    // find index in softwareList and set the corresponding control true
    const idx = this.softwareList.findIndex(s => (typeof s === 'string' ? s : s.name) === name);
    if (idx !== -1) {
      const ctrl = this.softwareFormArray.at(idx);
      if (ctrl) ctrl.setValue(true);
    } else {
      // If software not in master list, optionally push to softwareList and formArray
      this.softwareList.push(name);
      const c = this.fb.control(true);
      if (!this.isEditing) c.disable({ emitEvent: false });
      this.softwareFormArray.push(c);
    }
    this.selectedSoftware = [...this.userSoftware];
  }

  removeSoftware(name: string) {
    if (!name) return;
    this.userSoftware = this.userSoftware.filter(x => x !== name);
    const idx = this.softwareList.findIndex(s => (typeof s === 'string' ? s : s.name) === name);
    if (idx !== -1) {
      const ctrl = this.softwareFormArray.at(idx);
      if (ctrl) ctrl.setValue(false);
    }
    this.selectedSoftware = [...this.userSoftware];
  }

  // patch primitive fields into the form (software handled separately via syncSoftwareControls)
  populateForm() {
    const patch = { ...this.user };
    patch.software = Array.isArray(this.user.software) ? [...this.user.software] : [];
    this.userForm.patchValue(patch);
    this.userSoftware = patch.software;
  }

  enableEdit() {
    this.isEditing = true;
    this.ensureFormState(); // enable form and checkboxes
  }

  updateUser() {
    // Helper to compare arrays ignoring order
    const arraysEqual = (a: any[] = [], b: any[] = []) => {
      if (a.length !== b.length) return false;
      const sa = [...a].map(String).sort();
      const sb = [...b].map(String).sort();
      for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false;
      return true;
    };

    // Ensure form is enabled so values are current (the form may be disabled outside edit mode)
    const wasDisabled = this.userForm.disabled;
    if (wasDisabled) this.userForm.enable();

    const updatedFields: any = {};
    const formValue = this.userForm.value;

    // Compare and collect changed primitive fields (exclude software here)
    Object.keys(formValue).forEach(key => {
      if (key === 'software') return;
      const newVal = formValue[key];
      const oldVal = this.originalUser[key];
      if (
        newVal !== oldVal &&
        newVal !== null &&
        newVal !== undefined &&
        newVal !== ""
      ) {
        updatedFields[key] = newVal;
      }
    });

    // Compare software arrays (userSoftware is maintained from the checkboxes)
    const oldSoftware = Array.isArray(this.originalUser.software) ? [...this.originalUser.software] : [];
    const newSoftware = Array.isArray(this.userSoftware) ? [...this.userSoftware] : [];
    if (!arraysEqual(oldSoftware, newSoftware)) {
      updatedFields['software'] = newSoftware;
    }

    // Always include location_id when any property (including software) is being updated.
    const resolvedLocationId = (formValue && formValue.location_id !== undefined) ? formValue.location_id : this.originalUser.location_id;
    if (Object.keys(updatedFields).length > 0) {
      updatedFields['location_id'] = resolvedLocationId;
    }

    // Remove client-only fields
    delete updatedFields.location_name;

    // If nothing changed, notify and return
    if (Object.keys(updatedFields).length === 0) {
      this.messageService.add({ severity: 'info', summary: 'No Changes', detail: 'Nothing to update' });
      if (wasDisabled) this.userForm.disable();
      return;
    }

    // Send patch to backend
    this.userService.updateUser(this.userId, updatedFields).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'User updated successfully' });

        // Merge updated fields into originalUser so future comparisons work
        this.originalUser = { ...this.originalUser, ...updatedFields };

        // keep UI state consistent
        this.userForm.markAsPristine();
        this.isEditing = false;
        this.ensureFormState(); // disable after save
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update user' });
        // restore previous disabled state if needed
        if (wasDisabled) this.userForm.disable();
      }
    });
  }

  // other helpers (autocomplete, location, etc.) remain the same
  filterSoftware(event: any) {
    const query = event.query.toLowerCase();
    this.softwareOptions = this.softwareList.filter((sw: any) =>
      (typeof sw === 'string' ? sw.toLowerCase() : (sw.name || '').toLowerCase()).includes(query)
    );
  }

  locationName(event: any) {
    const query = event.query.toLowerCase();
    this.locationsName = this.locations.filter(loc =>
      loc.name.toLowerCase().includes(query)
    );
  }

  onSelectLocation(event: any) {
    this.userForm.patchValue({ location_id: event.value.id, location_name: event.value.name });
  }

  onSoftwareSelect(event: any) {
    const name = event && (event.name || event);
    if (name) this.addSoftware(name);
  }

  onSoftwareCheckChange(sw: any) {
    // used if you're wiring events from custom checkbox list; keep for compatibility
    const name = sw && sw.name;
    if (!name) return;
    if (sw.checked) this.addSoftware(name);
    else this.removeSoftware(name);
  }

  goBack() {
    this.router.navigate(['/users']);
  }
}
// ...existing code...