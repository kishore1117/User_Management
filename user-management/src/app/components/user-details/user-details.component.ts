import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { FormBuilder, FormGroup, FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ["./user-details.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  isAdmin: boolean = false;
  isEditing = false;
  user: any = {};
  loading = true;
  originalUser: any = {};
  selectedSoftware: any[] = [];
  isPrinterSelected: boolean = false;
  softwareInputValue: string = '';
  printer_id: number = 49;
  selectedCategory: string = 'Other';

  // Lookup data
  printer_type: any[] = [{ label: 'Network', value: 'NETWORK' }, { label: 'USB', value: 'USB' }];
  departments: any[] = [];
  divisions: any[] = [];
  locations: any[] = [];
  categories: any[] = [];
  models: any[] = [];
  cpuSerials: any[] = [];
  processors: any[] = [];
  cpuSpeeds: any[] = [];
  rams: any[] = [];
  hdds: any[] = [];
  monitors: any[] = [];
  monitorSerials: any[] = [];
  keyboards: any[] = [];
  mice: any[] = [];
  cdDvds: any[] = [];
  operatingSystems: any[] = [];
  softwareList: any[] = [];
  warranties: any[] = [];
  purchaseFrom: any[] = [];

  // Category-based field visibility mapping
  categoryFieldMap: { [key: string]: { hardware: string[], network: string[], software: boolean } } = {
    // Map category names to visible hardware, network, and software fields
    'Desktop': {
      hardware: ['model', 'cpu_serial', 'processor', 'cpu_speed', 'ram', 'hdd', 'os', 'monitor', 'monitor_serial', 'keyboard', 'mouse'],
      network: ['ip_address1'],
      software: true
    },
    'Laptop': {
      hardware: ['model', 'cpu_serial', 'processor', 'cpu_speed', 'ram', 'hdd', 'os'],
      network: ['ip_address1', 'ip_address2'],
      software: true
    },
    'Monitor': {
      hardware: ['model', 'monitor_serial'],
      network: [],
      software: false
    },
    'Keyboard': {
      hardware: ['model'],
      network: [],
      software: false
    },
    'Mouse': {
      hardware: ['model'],
      network: [],
      software: false
    },
    'Firewall':{
      hardware: ['model', 'processor','ram', 'hdd', 'os'],
      network: ['ip_address1'],
      software: false
    },
    'Printer': {
      hardware: ['model'],
      network: ['ip_address1'],
      software: true
    },
    'Storage':{
      hardware: ['model', 'processor','ram', 'hdd', 'os'],
      network: ['ip_address1', 'ip_address2'],
      software: false
    },
    'Server':{
      hardware: ['model', 'processor','cpu_speed', 'ram', 'hdd', 'os'],
      network: ['ip_address1', 'ip_address2'],
      software: true
    },
    'IP Phone':{
      hardware: ['model'],
      network: ['ip_address1'],
      software: false
    },
    'CCTV':{
      hardware: ['model'],
      network: ['ip_address1'],
      software: false
    },
    'Biomatric':{
      hardware: ['model'],
      network: ['ip_address1'],
      software: false
    },
    'Network Switch':{
      hardware: ['model'],
      network: ['ip_address1'],
      software: false
    } ,
    'Router': {
      hardware: ['model'],
      network: ['ip_address1'],
      software: false
    },
    'Switch': {
      hardware: ['model'],
      network: ['ip_address1'],
      software: false
    },
    'Other': {
      hardware: [],
      network: ['ip_address1'],
      software: true
    },
    'N/A':{
      hardware: [],
      network: ['ip_address1'],
      software: false
    },
    'Instrumentation machines':{
      hardware: ['model', 'cpu_serial', 'processor', 'cpu_speed', 'ram', 'hdd', 'os', 'monitor', 'monitor_serial', 'keyboard', 'mouse'],
      network: ['ip_address1', 'ip_address2'],
      software: true
    }
  };

  // For autocomplete
  filteredSoftware: any[] = [];
  userSoftware: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router,
    private fb: FormBuilder,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.initForm();
    this.userId = this.route.snapshot.paramMap.get('id');
    const role = localStorage.getItem('userRole');
    this.isAdmin = role === 'admin';
    // Load lookup data and user data in parallel
    forkJoin({
      lookupRes: this.userService.getLookupData(),
      userRes: this.userService.getUserById(this.userId)
    }).subscribe({
      next: ({ lookupRes, userRes }) => {
        // Extract lookup data
        if (lookupRes && lookupRes.data) {
          this.departments = lookupRes.data.departments || [];
          this.divisions = lookupRes.data.divisions || [];
          this.locations = lookupRes.data.locations || [];
          this.categories = lookupRes.data.categories || [];
          this.models = lookupRes.data.models || [];
          this.cpuSerials = lookupRes.data.cpu_serials || [];
          this.processors = lookupRes.data.processors || [];
          this.cpuSpeeds = lookupRes.data.cpu_speeds || [];
          this.rams = lookupRes.data.rams || [];
          this.hdds = lookupRes.data.hdds || [];
          this.monitors = lookupRes.data.monitors || [];
          this.monitorSerials = lookupRes.data.monitor_serials || [];
          this.keyboards = lookupRes.data.keyboards || [];
          this.mice = lookupRes.data.mice || [];
          this.cdDvds = lookupRes.data.cd_dvds || [];
          this.operatingSystems = lookupRes.data.operating_systems || [];
          this.softwareList = lookupRes.data.software || [];
          this.warranties = lookupRes.data.warranties || [];
          this.purchaseFrom = lookupRes.data.purchase_from || [];
        }

        // Extract user data
        this.user = (userRes && userRes.user) ? userRes.user : (userRes || {});
        this.userSoftware = Array.isArray(this.user.software) ? [...this.user.software] : [];

        // Populate form with user data
        this.populateForm();

        // Sync software checkboxes
        this.syncSoftwareControls();

        // Ensure form state
        this.ensureFormState();

        this.originalUser = JSON.parse(JSON.stringify(this.user));
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load data:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load user details' });
        this.loading = false;
      }
    });
     this.listenToCategoryChanges();
  }

  private initForm() {
    this.userForm = this.fb.group({
      name: [''],
      hostname: [''],
      serial_number: [''],
      printer_type: [''],
      department_id: [''],
      division_id: [''],
      location_id: [''],
      category_id: [''],
      ip_address1: [''],
      ip_address2: [''],
      model_id: [''],
      cpu_serial_id: [''],
      processor_id: [''],
      cpu_speed_id: [''],
      ram_id: [''],
      hdd_id: [''],
      monitor_id: [''],
      monitor_serial_id: [''],
      keyboard_id: [''],
      mouse_id: [''],
      cd_dvd_id: [''],
      os_id: [''],
      floor: [''],
      usb: [''],
      warranty_id: [''],
      purchase_from_id: [''],
      asset_tag: [''],
      softwareInput: [''],  // Add this line
      software: this.fb.array([])
    });
    this.userForm.disable();
  }

  onSoftwareInputChange(value: string) {
    this.softwareInputValue = value;
    this.filterSoftware({ query: value });
  }

  listenToCategoryChanges() {
    this.userForm.get('category_id')?.valueChanges.subscribe(catId => {
      if(catId === this.printer_id){
        this.isPrinterSelected = true;
      }
    });
  }

  private syncSoftwareControls() {
    const formArray = this.softwareFormArray;
    if (!formArray) return;
    formArray.clear();

    for (const sw of this.softwareList) {
      const name = sw.name || '';
      const isChecked = this.userSoftware.includes(name);
      formArray.push(new FormControl(isChecked));
    }

    this.ensureFormState();
  }

  private ensureFormState() {
    const enabled = !!this.isEditing;
    if (enabled) {
      this.userForm.enable({ emitEvent: false });
    } else {
      this.userForm.disable({ emitEvent: false });
    }

    const arr = this.softwareFormArray;
    if (!arr) return;
    arr.controls.forEach(ctrl => {
      if (enabled) ctrl.enable({ emitEvent: false });
      else ctrl.disable({ emitEvent: false });
    });
  }

  get softwareFormArray(): FormArray {
    return this.userForm.get('software') as FormArray;
  }

  private populateForm() {
    const patch: any = {
      name: this.user.name,
      hostname: this.user.hostname,
      ip_address1: this.user.ip_address1,
      ip_address2: this.user.ip_address2,
      floor: this.user.floor,
      usb: this.user.usb,
      asset_tag: this.user.asset_tag,
      serial_number: this.user.serial_number,
      printer_type: this.user.printer_type
    };

    if(this.user.category_name === 'Printer'){
      this.isPrinterSelected = true;
    }

    // Find IDs from names in lookup data
    if (this.user.department_name) {
      const dept = this.departments.find(d => d.name === this.user.department_name);
      patch.department_id = dept?.id;
    }

    if (this.user.warranty) {
      const warr = this.warranties.find(w => w.name === this.user.warranty);
      patch.warranty_id = warr?.id;
    }

    if (this.user.purchase_from) {
      const pf = this.purchaseFrom.find(p => p.name === this.user.purchase_from);
      patch.purchase_from_id = pf?.id;
    }

    if (this.user.division_name) {
      const div = this.divisions.find(d => d.name === this.user.division_name);
      patch.division_id = div?.id;
    }

    if (this.user.location_name) {
      const loc = this.locations.find(l => l.name === this.user.location_name);
      patch.location_id = loc?.id;
    }

    if (this.user.category_name) {
      const cat = this.categories.find(c => c.name === this.user.category_name);
      patch.category_id = cat?.id;
    }

    if (this.user.model) {
      const model = this.models.find(m => m.name === this.user.model);
      patch.model_id = model?.id;
    }

    if (this.user.cpu_serial) {
      const serial = this.cpuSerials.find(s => s.name === this.user.cpu_serial);
      patch.cpu_serial_id = serial?.id;
    }

    if (this.user.processor) {
      const proc = this.processors.find(p => p.name === this.user.processor);
      patch.processor_id = proc?.id;
    }

    if (this.user.cpu_speed) {
      const speed = this.cpuSpeeds.find(s => s.name === this.user.cpu_speed);
      patch.cpu_speed_id = speed?.id;
    }

    if (this.user.ram) {
      const ram = this.rams.find(r => r.name === this.user.ram);
      patch.ram_id = ram?.id;
    }

    if (this.user.hdd) {
      const hdd = this.hdds.find(h => h.name === this.user.hdd);
      patch.hdd_id = hdd?.id;
    }

    if (this.user.monitor) {
      const mon = this.monitors.find(m => m.name === this.user.monitor);
      patch.monitor_id = mon?.id;
    }

    if (this.user.monitor_serial) {
      const monSerial = this.monitorSerials.find(m => m.name === this.user.monitor_serial);
      patch.monitor_serial_id = monSerial?.id;
    }

    if (this.user.keyboard) {
      const kbd = this.keyboards.find(k => k.name === this.user.keyboard);
      patch.keyboard_id = kbd?.id;
    }

    if (this.user.mouse) {
      const m = this.mice.find(m => m.name === this.user.mouse);
      patch.mouse_id = m?.id;
    }

    if (this.user.cd_dvd) {
      const cd = this.cdDvds.find(c => c.name === this.user.cd_dvd);
      patch.cd_dvd_id = cd?.id;
    }

    if (this.user.os) {
      const os = this.operatingSystems.find(o => o.name === this.user.os);
      patch.os_id = os?.id;
    }

    this.userForm.patchValue(patch);
  }

  onSoftwareCheckboxChange() {
    const selected = this.softwareFormArray.controls
      .map((ctrl, i) => (ctrl as FormControl).value ? this.softwareList[i]?.name : null)
      .filter(v => v !== null) as string[];

    this.userSoftware = selected;
  }

  addSoftware(software: any) {
    if (!software || !software.name) return;
    const name = software.name;

    if (!this.userSoftware.includes(name)) {
      this.userSoftware.push(name);
    }

    const idx = this.softwareList.findIndex(s => s.name === name);
    if (idx !== -1) {
      const ctrl = this.softwareFormArray.at(idx) as FormControl;
      if (ctrl) ctrl.setValue(true);
    }

    // Clear the input
    const softwareInputCtrl = this.userForm.get('softwareInput');
    if (softwareInputCtrl) {
      softwareInputCtrl.setValue('');
    }

    this.softwareInputValue = '';
    this.filteredSoftware = [];
  }

  removeSoftware(name: string) {
    if (!name) return;
    this.userSoftware = this.userSoftware.filter(x => x !== name);
    const idx = this.softwareList.findIndex(s => s.name === name);
    if (idx !== -1) {
      const ctrl = this.softwareFormArray.at(idx) as FormControl;
      if (ctrl) ctrl.setValue(false);
    }
  }

  getSoftwareControl(index: number): FormControl {
    return this.softwareFormArray.at(index) as FormControl;
  }

  updateUser() {
    const arraysEqual = (a: any[] = [], b: any[] = []) => {
      if (a.length !== b.length) return false;
      const sa = [...a].map(String).sort();
      const sb = [...b].map(String).sort();
      for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return false;
      return true;
    };

    const wasDisabled = this.userForm.disabled;
    if (wasDisabled) this.userForm.enable();

    const updatedFields: any = {};
    const formValue = this.userForm.value;

    // Get current location_id from form
    const currentLocationId = formValue.location_id;
    const originalLocationId = this.originalUser.location_id;

    // Flag to check if location was changed
    let locationChanged = false;

    // Compare primitive fields
    Object.keys(formValue).forEach(key => {
      if (key === 'software' || key === 'softwareInput') return;

      const newVal = formValue[key];
      const oldVal = this.originalUser[key];

      // Track if location changed
      if (key === 'location_id') {
        if (newVal !== oldVal && newVal !== null && newVal !== undefined && newVal !== "") {
          locationChanged = true;
        }
        return; // Don't add to updatedFields yet
      }

      if (newVal !== oldVal && newVal !== null && newVal !== undefined && newVal !== "") {
        updatedFields[key] = newVal;
      }
    });

    // Handle location_id: always send it, but only if changed
    if (locationChanged) {
      // User explicitly changed location, send only the new location_id
      updatedFields['location_id'] = currentLocationId;
    } else if (currentLocationId) {
      // No change in location, but send it as default
      updatedFields['location_id'] = currentLocationId;
    } else if (originalLocationId) {
      // Fallback to original location_id if nothing selected
      updatedFields['location_id'] = originalLocationId;
    }

    // Compare software
    const oldSoftware = Array.isArray(this.originalUser.software) ? [...this.originalUser.software] : [];
    const newSoftware = Array.isArray(this.userSoftware) ? [...this.userSoftware] : [];
    if (!arraysEqual(oldSoftware, newSoftware)) {
      updatedFields['software'] = newSoftware;
    }

    if (Object.keys(updatedFields).length === 0) {
      this.messageService.add({ severity: 'info', summary: 'No Changes', detail: 'Nothing to update' });
      if (wasDisabled) this.userForm.disable();
      return;
    }


    this.userService.updateUser(this.userId, updatedFields).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'User updated successfully' });
        this.originalUser = { ...this.originalUser, ...updatedFields };
        this.userForm.markAsPristine();
        this.isEditing = false;
        this.ensureFormState();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update user' });
        if (wasDisabled) this.userForm.disable();
      }
    });
  }

  filterSoftware(event: any) {
    const query = event.query.toLowerCase();
    this.filteredSoftware = this.softwareList.filter((sw: any) =>
      sw.name.toLowerCase().includes(query) && !this.userSoftware.includes(sw.name)
    );
  }

  enableEdit() {
    this.isEditing = true;
    this.ensureFormState();
  }

  // Get visible hardware fields based on selected category
  getVisibleHardwareFields(): string[] {
    const selectedCategoryId = this.userForm.get('category_id')?.value;
    const selectedCategory = this.categories.find(cat => cat.id === selectedCategoryId);
    const categoryName = selectedCategory?.name || 'Other';
    return this.categoryFieldMap[categoryName]?.hardware || [];
  }

  // Get visible network fields based on selected category
  getVisibleNetworkFields(): string[] {
    const selectedCategoryId = this.userForm.get('category_id')?.value;
    const selectedCategory = this.categories.find(cat => cat.id === selectedCategoryId);
    const categoryName = selectedCategory?.name || 'Other';
    return this.categoryFieldMap[categoryName]?.network || [];
  }

  // Check if a specific hardware field should be visible
  isHardwareFieldVisible(fieldName: string): boolean {
    return this.getVisibleHardwareFields().includes(fieldName);
  }

  // Check if a specific network field should be visible
  isNetworkFieldVisible(fieldName: string): boolean {
    return this.getVisibleNetworkFields().includes(fieldName);
  }

  // Check if hardware section should be shown
  hasVisibleHardwareFields(): boolean {
    return this.getVisibleHardwareFields().length > 0;
  }

  // Check if network section should be shown
  hasVisibleNetworkFields(): boolean {
    return this.getVisibleNetworkFields().length > 0;
  }

  // Check if software section should be shown
  shouldShowSoftware(): boolean {
    const selectedCategoryId = this.userForm.get('category_id')?.value;
    const selectedCategory = this.categories.find(cat => cat.id === selectedCategoryId);
    const categoryName = selectedCategory?.name || 'Other';
    return this.categoryFieldMap[categoryName]?.software || false;
  }

  goBack() {
    this.router.navigate(['/users']);
  }

  getNameById(list: any[], id: any): string {
    if (!id) return '';
    const item = list.find(l => l.id === id);
    return item ? item.name : '';
  }
}