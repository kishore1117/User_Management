import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpEventType } from '@angular/common/http';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { ToastService } from '../../services/toastMessage.service';

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
  progress = 0;
  private baseUrl = 'http://localhost:3000/api/upload';
  departments: string[] = [];
  selectedDepartment: string = '';
  showBulkDeleteModal = false; // Updated endpoint

  constructor(private http: HttpClient, private toastService: ToastService) {}

  ngOnInit() {
    this.loadDepartments();
  }

   loadDepartments() {
    this.http.get<any[]>('http://localhost:3000/api/users').subscribe({
      next: (users) => {
        this.departments = [...new Set(users.map((u) => u.department))];
      },
      error: (err) => console.error('Error fetching departments:', err)
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
    if (!this.selectedDepartment) return;
    this.showBulkDeleteModal = true;
  }

  confirmBulkDelete() {
    const dept = this.selectedDepartment;

    this.http.delete(`http://localhost:3000/api/users/department/${dept}`).subscribe({
      next: (res) => {
        console.log('Deleted all users from:', dept);
        this.showBulkDeleteModal = false;
        this.selectedDepartment = '';
        this.loadDepartments(); // Refresh department list after deletion
      },
      error: (err) => {
        console.error('Error deleting users:', err);
        this.showBulkDeleteModal = false;
      }
    });
  }

  cancelBulkDelete() {
    this.showBulkDeleteModal = false;
  }


}