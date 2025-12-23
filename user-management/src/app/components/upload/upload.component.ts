import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpEventType } from '@angular/common/http';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { ToastService } from '../../services/toastMessage.service';
import { MessageService } from 'primeng/api';
import { environment } from '../../../environments/environment';
interface UploadResponse {
  message: string;
  results?: {
    totalProcessed: number;
    successful: number;
    failed: number;
    errors?: Array<{
      row: number;
      data: any;
      error: string;
    }>;
  };
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
  animations: [
    trigger('fade', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('hidden <=> visible', [animate('300ms ease-in-out')]),
    ]),
  ],
})
export class UploadComponent {
  selectedFile: File | null = null;
  uploading = false;
 
  user: any = {
    location_id: null
  };
  progress = 0;
  private baseUrl = `${environment.apiBaseUrl}/upload`;
  departments: string[] = [];
  locations: any[] = [];
  selectedDepartment: string = '';
  showBulkDeleteModal = false; // Updated endpoint

  constructor(private http: HttpClient, private toastService: ToastService, private messageService: MessageService,) { }

  ngOnInit() {
    this.loadLocations();
  }

  loadLocations() {
    this.http.get<any>(`${environment.apiBaseUrl}/locations/allowed`)
      .subscribe({
        next: (res) => {
          this.locations = res.data || [];
          console.log('Loaded locations:', this.locations);

          // auto-select if only one location
          if (this.locations.length === 1) {
            this.user.location_id = this.locations[0].id;
          }
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load locations' });
        }
      });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      // Reset progress when new file is selected
      this.progress = 0;
    }
  }

  upload() {
    if (!this.selectedFile) {
      this.toastService.show('Please select a file to upload.', 'error');
      return;
    }

    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!allowed.includes(this.selectedFile.type) &&
      !this.selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      this.toastService.show('Invalid file type. Use .xlsx, .xls or .csv', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.uploading = true;
    this.progress = 0;

    this.http.post<UploadResponse>(this.baseUrl, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.progress = Math.round((100 * event.loaded) / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.uploading = false;
          const response = event.body;

          if (response?.results) {
            const { successful, failed, totalProcessed } = response.results;

            let message = `Upload complete: ${successful} of ${totalProcessed} records added`;
            if (failed > 0) {
              message += `, ${failed} failed`;
            }

            this.toastService.show(message, failed > 0 ? 'error' : 'success');
          } else {
            this.toastService.show('Upload completed successfully', 'success');
          }

          this.clear();
        }
      },
      error: (error) => {
        this.uploading = false;
        this.progress = 0;
        const errorMessage = error.error?.message || 'Upload failed. Please try again.';
        this.toastService.show(errorMessage, 'error');
      }
    });
  }

  clear() {
    this.selectedFile = null;
    this.progress = 0;
    this.uploading = false;
  }

  // Helper method to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  openBulkDeleteModal() {
    if (!this.user.location_id) return;
    this.showBulkDeleteModal = true;
  }

  confirmBulkDelete() {
   const locationId = this.user.location_id;

    this.http.delete(`${environment.apiBaseUrl}/users/bulk-delete?location_id=${locationId}`).subscribe({
      next: (res) => {
        this.showBulkDeleteModal = false;
        this.messageService.add({ severity:'success', summary:'Success', detail:'Users deleted successfully' });
        this.user.location_id = null;
      },
      error: (err) => {
        this.messageService.add({ severity:'error', summary:'Error', detail: err.error?.message || 'Failed to delete users' });
        this.showBulkDeleteModal = false;
      }
    });
  }

  cancelBulkDelete() {
    this.showBulkDeleteModal = false;
  }


}