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
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { DialogModule } from 'primeng/dialog';

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
    AutoCompleteModule,
    TooltipModule,
    DialogModule
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

  // Handover form properties
  handoverForm!: FormGroup;
  showHandoverModal = false;

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
  keyboards: any[] = [];
  mice: any[] = [];
  cdDvds: any[] = [];
  operatingSystems: any[] = [];
  softwareList: any[] = [];
  licencesList: any[] = [];
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
      network: ['ip_address1'],
      software: true
    },
    // 'Monitor': {
    //   hardware: ['model', 'monitor_serial'],
    //   network: [],
    //   software: false
    // },
    // 'Keyboard': {
    //   hardware: ['model'],
    //   network: [],
    //   software: false
    // },
    // 'Mouse': {
    //   hardware: ['model'],
    //   network: [],
    //   software: false
    // },
    'Firewall':{
      hardware: ['model', 'processor','ram', 'hdd', 'os'],
      network: ['ip_address1'],
      software: false
    },
    'Printer': {
      hardware: ['model'],
      network: ['ip_address1'],
      software: false
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
  filteredLicences: any[] = [];
  userSoftware: string[] = [];
  userLicences: string[] = [];
  licenceInputValue: string = '';

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router,
    private fb: FormBuilder,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    console.log(this.userLicences)
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
          this.keyboards = lookupRes.data.keyboards || [];
          this.mice = lookupRes.data.mice || [];
          this.cdDvds = lookupRes.data.cd_dvds || [];
          this.operatingSystems = lookupRes.data.operating_systems || [];
          this.softwareList = lookupRes.data.software || [];
          this.licencesList = lookupRes.data.licences || [];
          this.warranties = lookupRes.data.warranties || [];
          this.purchaseFrom = lookupRes.data.purchase_from || [];
        }

        // Extract user data
        this.user = (userRes && userRes.user) ? userRes.user : (userRes || {});
        this.userSoftware = Array.isArray(this.user.software) ? [...this.user.software] : [];
        this.userLicences = Array.isArray(this.user.licences) ? [...this.user.licences] : [];

        // Populate form with user data
        this.populateForm();

        // Sync software and licence checkboxes
        this.syncSoftwareControls();
        this.syncLicenceControls();

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
      monitor_serial_number: [''],
      keyboard_id: [''],
      mouse_id: [''],
      cd_dvd_id: [''],
      os_id: [''],
      floor: [''],
      usb: [''],
      warranty_id: [''],
      purchase_from_id: [''],
      asset_tag: [''],
      softwareInput: [''],
      licenceInput: [''],
      software: this.fb.array([]),
      licence: this.fb.array([])
    });
    this.userForm.disable();

    // Initialize handover form
    this.initHandoverForm();
  }

  private initHandoverForm() {
    this.handoverForm = this.fb.group({
      employeeName: [this.user.name || ''],
      empCode: [''],
      department: [this.user.department_name || ''],
      handoverDate: [new Date().toISOString().split('T')[0]],
      handoverBy: [''],
      model: [this.user.model || ''],
      slNo: [this.user.hostname || ''],
      processor: [this.user.processor || ''],
      memory: [this.user.ram || ''],
      hdd: [this.user.hdd || ''],
      os: [this.user.os || ''],
      powerAdapter: ['Yes'],
      assetCode: [this.user.asset_tag || ''],
      qty: ['1'],
      remarks: [''],
      receiverSignature: [''],
      receiverName: [''],
      receiverDate: [new Date().toISOString().split('T')[0]]
    });
  }

  onSoftwareInputChange(value: string) {
    this.softwareInputValue = value;
    this.filterSoftware({ query: value });
  }

  onLicenceInputChange(value: string) {
    this.licenceInputValue = value;
    this.filterLicence({ query: value });
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

  private syncLicenceControls() {
    const formArray = this.licenceFormArray;
    if (!formArray) return;
    formArray.clear();

    for (const lic of this.licencesList) {
      const name = lic.name || '';
      const isChecked = this.userLicences.includes(name);
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

    const licArr = this.licenceFormArray;
    if (!licArr) return;
    licArr.controls.forEach(ctrl => {
      if (enabled) ctrl.enable({ emitEvent: false });
      else ctrl.disable({ emitEvent: false });
    });
  }

  get softwareFormArray(): FormArray {
    return this.userForm.get('software') as FormArray;
  }

  get licenceFormArray(): FormArray {
    return this.userForm.get('licence') as FormArray;
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
      printer_type: this.user.printer_type,
      monitor_serial_number: this.user.monitor_serial_number,
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

    // if (this.user.monitor_serial) {
    //   const monSerial = this.monitorSerials.find(m => m.name === this.user.monitor_serial);
    //   patch.monitor_serial_id = monSerial?.id;
    // }

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

  onLicenceCheckboxChange() {
    const selected = this.licenceFormArray.controls
      .map((ctrl, i) => (ctrl as FormControl).value ? this.licencesList[i]?.name : null)
      .filter(v => v !== null) as string[];

    this.userLicences = selected;
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

  addLicence(licence: any) {
    if (!licence || !licence.name) return;
    const name = licence.name;
    console.log(`name: ${name}`);

    if (!this.userLicences.includes(name)) {
      this.userLicences.push(name);
    }

    const idx = this.licencesList.findIndex(l => l.name === name);
    if (idx !== -1) {
      const ctrl = this.licenceFormArray.at(idx) as FormControl;
      if (ctrl) ctrl.setValue(true);
    }

    // Clear the input
    const licenceInputCtrl = this.userForm.get('licenceInput');
    if (licenceInputCtrl) {
      licenceInputCtrl.setValue('');
    }

    this.licenceInputValue = '';
    this.filteredLicences = [];
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

  removeLicence(name: string) {
    if (!name) return;
    this.userLicences = this.userLicences.filter(x => x !== name);
    const idx = this.licencesList.findIndex(l => l.name === name);
    if (idx !== -1) {
      const ctrl = this.licenceFormArray.at(idx) as FormControl;
      if (ctrl) ctrl.setValue(false);
    }
  }

  getSoftwareControl(index: number): FormControl {
    return this.softwareFormArray.at(index) as FormControl;
  }

  getLicenceControl(index: number): FormControl {
    return this.licenceFormArray.at(index) as FormControl;
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
      if (key === 'software' || key === 'softwareInput' || key === 'licence' || key === 'licenceInput') return;

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

    // Compare licences
    const oldLicences = Array.isArray(this.originalUser.licences) ? [...this.originalUser.licences] : [];
    const newLicences = Array.isArray(this.userLicences) ? [...this.userLicences] : [];
    if (!arraysEqual(oldLicences, newLicences)) {
      updatedFields['licences'] = newLicences;
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

  filterLicence(event: any) {
    const query = event.query.toLowerCase();
    this.filteredLicences = this.licencesList.filter((lic: any) =>
      lic.name.toLowerCase().includes(query) && !this.userLicences.includes(lic.name)
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

  // Get category-specific asset details
  getCategorySpecificAssetDetails(): string {
    const categoryName = this.user.category_name || 'Other';
    const fieldConfig = this.categoryFieldMap[categoryName] || this.categoryFieldMap['Other'];
    const hardwareFields = fieldConfig.hardware || [];
    const networkFields = fieldConfig.network || [];
    
    let assetDetailsHTML = '';
    
    // Map field names to display labels and user object properties
    const fieldLabelMap: { [key: string]: string } = {
      'model': 'Model',
      'cpu_serial': 'CPU Serial',
      'processor': 'Processor',
      'cpu_speed': 'CPU Speed',
      'ram': 'RAM',
      'hdd': 'HDD',
      'os': 'Operating System',
      'monitor': 'Monitor',
      'monitor_serial': 'Monitor Serial',
      'keyboard': 'Keyboard',
      'mouse': 'Mouse',
      'cd_dvd': 'CD/DVD Drive',
      'usb': 'USB',
      'ip_address1': 'IP Address 1',
      'ip_address2': 'IP Address 2'
    };

    // Add hardware fields
    if (hardwareFields.length > 0) {
      assetDetailsHTML += '<div class="asset-item"><strong style="color: #0066cc;">Hardware Components:</strong></div>';
      hardwareFields.forEach(field => {
        const label = fieldLabelMap[field] || field;
        const value = (this.user as any)[field] || 'N/A';
        assetDetailsHTML += `<div class="asset-item" style="margin-left: 15px;"><strong>${label}:</strong> ${value}</div>`;
      });
    }

    // Add network fields
    if (networkFields.length > 0) {
      assetDetailsHTML += '<div class="asset-item"><strong style="color: #0066cc; margin-top: 10px;">Network Information:</strong></div>';
      networkFields.forEach(field => {
        const label = fieldLabelMap[field] || field;
        const value = (this.user as any)[field] || 'N/A';
        assetDetailsHTML += `<div class="asset-item" style="margin-left: 15px;"><strong>${label}:</strong> ${value}</div>`;
      });
    }

    // Add software if applicable
    if (fieldConfig.software && this.user.software && this.user.software.length > 0) {
      assetDetailsHTML += `<div class="asset-item"><strong style="color: #0066cc; margin-top: 10px;">Installed Software:</strong></div>`;
      const softwareList = Array.isArray(this.user.software) ? this.user.software.join(', ') : this.user.software;
      assetDetailsHTML += `<div class="asset-item" style="margin-left: 15px;"><strong>Software:</strong> ${softwareList}</div>`;
    }

    return assetDetailsHTML;
  }

  // printDeclaration() {
  //   console.log('Printing declaration for user:', this.user);
  //   const printWindow = window.open('', '_blank');
  //   if (!printWindow) return;

  //   const categorySpecificDetails = this.getCategorySpecificAssetDetails();

  //   const declarationHTML = `
  //     <!DOCTYPE html>
  //     <html lang="en">
  //     <head>
  //       <meta charset="UTF-8">
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
  //       <title>Asset Declaration Form</title>
  //       <style>
  //         body {
  //           font-family: Arial, sans-serif;
  //           margin: 20px;
  //           line-height: 1.6;
  //         }
  //         .header {
  //           text-align: center;
  //           border-bottom: 2px solid #000;
  //           padding-bottom: 10px;
  //           margin-bottom: 20px;
  //         }
  //         .company-info {
  //           margin-bottom: 20px;
  //         }
  //         .declaration-title {
  //           font-size: 18px;
  //           font-weight: bold;
  //           margin-bottom: 10px;
  //         }
  //         .declaration-text {
  //           margin-bottom: 20px;
  //           text-align: justify;
  //         }
  //         .asset-details {
  //           margin-bottom: 20px;
  //         }
  //         .asset-details h3 {
  //           margin-bottom: 10px;
  //         }
  //         .asset-list {
  //           border: 1px solid #ccc;
  //           padding: 10px;
  //           background-color: #f9f9f9;
  //         }
  //         .asset-item {
  //           margin-bottom: 5px;
  //           font-size: 12px;
  //         }
  //         .acceptance {
  //           margin-bottom: 30px;
  //         }
  //         .signature-section {
  //           margin-top: 40px;
  //         }
  //         .signature-line {
  //           border-bottom: 1px solid #000;
  //           width: 300px;
  //           display: inline-block;
  //         }
  //         .basic-info {
  //           border-bottom: 1px solid #ddd;
  //           padding-bottom: 10px;
  //           margin-bottom: 10px;
  //         }
  //         @media print {
  //           body {
  //             margin: 0;
  //           }
  //         }
  //       </style>
  //     </head>
  //     <body>
  //       <div class="header">
  //         <h1>Asset Declaration Form</h1>
  //       </div>

  //       <div class="company-info">
  //         <p><strong>Company Name:</strong> Your Company Ltd.</p>
  //         <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
  //       </div>

  //       <div class="declaration-title">Apec Asset Collection Declaration</div>

  //       <div class="declaration-text">
  //         I, <strong>${this.user.name || 'N/A'}</strong>, hereby declare that I have collected the following asset(s) with the specified specifications from the company. I acknowledge that I am responsible for the proper care and maintenance of these assets. I understand that I will be held liable for any damage, loss, or misuse of the assets until they are returned to the company in good condition.
  //       </div>

  //       <div class="asset-details">
  //         <h3>Asset Information:</h3>
  //         <div class="asset-list">
  //           <div class="basic-info">
  //             <div class="asset-item"><strong>Employee Name:</strong> ${this.user.name || 'N/A'}</div>
  //             <div class="asset-item"><strong>Hostname:</strong> ${this.user.hostname || 'N/A'}</div>
  //             <div class="asset-item"><strong>Location:</strong> ${this.user.location_name || 'N/A'}</div>
  //             <div class="asset-item"><strong>Department:</strong> ${this.user.department_name || 'N/A'}</div>
  //             <div class="asset-item"><strong>Asset Category:</strong> ${this.user.category_name || 'N/A'}</div>
  //             <div class="asset-item"><strong>Asset Tag:</strong> ${this.user.asset_tag || 'N/A'}</div>
  //             <div class="asset-item"><strong>Warranty:</strong> ${this.user.warranty || 'N/A'}</div>
  //             <div class="asset-item"><strong>Purchase From:</strong> ${this.user.purchase_from || 'N/A'}</div>
  //           </div>
  //           ${categorySpecificDetails}
  //         </div>
  //       </div>

  //       <div class="acceptance">
  //         <strong>Acceptance & Responsibility:</strong>
  //         <p style="margin-top: 10px; text-align: justify;">
  //           I accept full responsibility for the assets listed above and agree to return them in the same condition as received, barring normal wear and tear. I understand that I will be held accountable for any damage, loss, or theft of these assets during my custody.
  //         </p>
  //       </div>

  //       <div class="signature-section">
  //         <p>Signature: <span class="signature-line"></span></p>
  //         <p>Employee Name: ${this.user.name || 'N/A'}</p>
  //         <p>Date: ${new Date().toLocaleDateString()}</p>
  //         <p style="margin-top: 30px; font-size: 12px; border-top: 1px solid #000; padding-top: 10px;">
  //           <strong>For Office Use:</strong>
  //         </p>
  //         <p style="font-size: 12px;">Issued by: _________________________ Date: _____________</p>
  //       </div>
  //     </body>
  //     </html>
  //   `;

  //   printWindow.document.write(declarationHTML);
  //   printWindow.document.close();
  //   printWindow.focus();
  //   printWindow.print();
  // }

  openHandoverForm() {
    this.initHandoverForm();
    this.showHandoverModal = true;
  }

  closeHandoverModal() {
    this.showHandoverModal = false;
  }

  generateHandoverPDF() {
    const formData = this.handoverForm.value;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const handoverHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title></title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            line-height: 1.4;
            font-size: 12px;
          }
          .page-wrapper {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }
          .content {
            flex: 1;
            padding-bottom: 180px; /* reserve space for fixed footer */
          }
          .logo-section {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
          }
          .logo-image {
            width: 80px;
            height: 40px;
          }
          .logo-text-section {
            text-align: left;
          }
          .logo-text {
            font-size: 24px;
            font-weight: bold;
            color: #0066cc;
            margin: 0;
            letter-spacing: 2px;
          }
          .company-tagline {
            font-size: 10px;
            color: #666;
            margin: 5px 0 0 0;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
          }
          .header h1 {
            margin: 10px 0;
            font-size: 16px;
            letter-spacing: 2px;
          }
          .company-info {
            font-size: 11px;
            margin-bottom: 15px;
            line-height: 1.4;
            text-align: center;
          }
          .form-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 11px;
          }
          .form-header-item {
            display: flex;
            gap: 10px;
          }
          .form-header-item label {
            font-weight: bold;
            min-width: 140px;
          }
          .form-header-item input {
            border: none;
            border-bottom: 1px solid #000;
            width: 180px;
            font-family: Arial, sans-serif;
            font-size: 11px;
            padding: 2px;
            background: transparent;
          }
          .intro-text {
            margin: 15px 0;
            font-size: 11px;
            line-height: 1.5;
            text-align: justify;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11px;
          }
          table, th, td {
            border: 1px solid #000;
          }
          th {
            background-color: #f0f0f0;
            padding: 5px;
            text-align: left;
            font-weight: bold;
          }
          td {
            padding: 5px;
            min-height: 20px;
            vertical-align: top;
          }
          .section-title {
            font-weight: bold;
            margin-top: 15px;
            margin-bottom: 10px;
            font-size: 12px;
            text-decoration: underline;
          }
          .acknowledgement {
            line-height: 1.6;
            text-align: justify;
            font-size: 11px;
            margin: 15px 0;
          }
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 15px 20px 20px;
            border-top: 1px solid #ccc;
            background: #fff;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
          }
          .signature-block {
            text-align: center;
            width: 45%;
            font-size: 10px;
          }
          .signature-space {
            margin: 20px 0 5px 0;
            min-height: 30px;
          }
          .signature-label {
            font-size: 10px;
            font-weight: bold;
            margin-top: 5px;
          }
          @media print {
            body {
              margin: 0;
              padding: 10px;
            }
            .page-wrapper {
              min-height: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-wrapper">
          <div class="content">
            <div class="logo-section">
              <div class="logo-text-section">
                <p class="logo-text" style='color:#000'>APEX LABORATORIES</p>
              </div>
            </div>

            <div class="header">
              <h1>LAPTOP HANDOVER FORM</h1>
            </div>

            <div class="company-info">
              <div>SIDCO Garment Complex, III Floor, Guindy, Chennai-600032, Tamilnadu, India.</div>
              <div>Ph: 044 4222 5000 | www.apexlab.com</div>
            </div>

            <div class="form-header">
              <div class="form-header-item">
                <label>Name of the Employee:</label>
                <input type="text" value="${formData.employeeName}" readonly>
              </div>
              <div class="form-header-item">
                <label>Handover Date:</label>
                <input type="text" value="${formData.handoverDate}" readonly>
              </div>
            </div>

            <div class="form-header">
              <div class="form-header-item">
                <label>Emp. Code:</label>
                <input type="text" value="${formData.empCode}" readonly style="width: 80px;">
              </div>
              <div class="form-header-item">
                <label>Handover By:</label>
                <input type="text" value="${formData.handoverBy}" readonly>
              </div>
            </div>

            <div class="form-header">
              <div class="form-header-item">
                <label>Department:</label>
                <input type="text" value="${formData.department}" readonly>
              </div>
            </div>

            <div class="intro-text">
              <p><strong>Dear Sir / Madam</strong></p>
              <p>Please find the below is the assets handed over to you, to support you in carrying out your assignment in a most Proficient manner.</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 5%;">Sl. No</th>
                  <th style="width: 30%;">Particulars</th>
                  <th style="width: 15%;">Asset code</th>
                  <th style="width: 10%;">Qty</th>
                  <th style="width: 40%;">Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>01</td>
                  <td>
                    <div><strong>Model:</strong> ${formData.model}</div>
                    <div><strong>Sl No:</strong> ${formData.slNo}</div>
                    <div><strong>Processor:</strong> ${formData.processor}</div>
                    <div><strong>Memory:</strong> ${formData.memory}</div>
                    <div><strong>HDD:</strong> ${formData.hdd}</div>
                    <div><strong>OS:</strong> ${formData.os}</div>
                    <div><strong>Power Adapter:</strong> ${formData.powerAdapter}</div>
                  </td>
                  <td>${formData.assetCode}</td>
                  <td>${formData.qty}</td>
                  <td>${formData.remarks}</td>
                </tr>
              </tbody>
            </table>

            <div class="section-title">Acknowledgement and Declaration by Employee</div>

            <div class="acknowledgement">
              I, <strong>${formData.employeeName}</strong>, hereby acknowledge that I have received the above mentioned asset. I understand that this asset belongs to Apex laboratories Pvt Ltd and is under my possession for carrying out my office work. I hereby assure that I will take care of the assets of the company to the best possible extent. If the Company needs to replace this property as result of violation of this agreement, I agree to pay for its replacement cost.
            </div>
          </div>

          <div class="footer">
            <div class="signature-section">
              <div class="signature-block">
                <p style="margin: 0; font-weight: bold;">For Apex Laboratories Pvt Ltd.</p>
                <p style="margin: 0;">Signature</p>
                <div class="signature-space"></div>
                <p class="signature-label">Information Technology</p>
                <p style="margin: 5px 0 0 0;">Date: ${formData.handoverDate}</p>
              </div>

              <div class="signature-block">
                <p style="margin: 0; font-weight: bold;">Receiver's</p>
                <div class="signature-space"></div>
                <p class="signature-label">Name: ${formData.receiverName}</p>
                <p style="margin: 5px 0 0 0;">Date: ${formData.receiverDate}</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(handoverHTML);
    printWindow.document.close();
    // Clear the document title so browser print headers are less intrusive
    printWindow.document.title = '';
    printWindow.focus();
    printWindow.print();
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