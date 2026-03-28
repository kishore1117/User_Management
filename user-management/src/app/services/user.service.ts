import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

interface FilterState {
  selectedDepartments: any[];
  selectedStatus: string;
  selectedCategory: string;
  selectedLocation: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.apiBaseUrl}/users`;
  private lookupUrl = `${environment.apiBaseUrl}/lookupData`;
  private userAccessUrl = `${environment.apiBaseUrl}/user-access`;

  // Filter state management
  private filterState = new BehaviorSubject<FilterState>({
    selectedDepartments: [],
    selectedStatus: '',
    selectedCategory: '',
    selectedLocation: ''
  });

  filterState$ = this.filterState.asObservable();

  constructor(private http: HttpClient) {
    this.loadFilterState();
  }

  // Save filter state to sessionStorage
  saveFilterState(filters: FilterState): void {
    this.filterState.next(filters);
    sessionStorage.setItem('userListFilters', JSON.stringify(filters));
  }

  // Load filter state from sessionStorage
  private loadFilterState(): void {
    const saved = sessionStorage.getItem('userListFilters');
    if (saved) {
      try {
        const filters = JSON.parse(saved);
        this.filterState.next(filters);
      } catch (e) {
        console.error('Error loading filter state:', e);
      }
    }
  }

  // Get current filter state
  getFilterState(): FilterState {
    return this.filterState.value;
  }

  // Clear filter state
  clearFilterState(): void {
    const emptyFilters: FilterState = {
      selectedDepartments: [],
      selectedStatus: '',
      selectedCategory: '',
      selectedLocation: ''
    };
    this.filterState.next(emptyFilters);
    sessionStorage.removeItem('userListFilters');
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}`);
  }

  addUserAccess(userData:any): Observable<any>{
    return this.http.post(`${this.userAccessUrl}`,userData);
  }

  updateUserAccess(id:any,userData:any): Observable<any>{
    return this.http.patch(`${this.userAccessUrl}/${id}`,userData);
  }

  deleteUserAccess(id:any): Observable<any>{
    return this.http.delete(`${this.userAccessUrl}/${id}`);
  }

  addUser(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}`, userData);
  }

  exportUsers(): Observable<Blob> {
    return this.http.get(`${environment.apiBaseUrl}/download`, { responseType: 'blob' });
  }

  findUser(criteria: any): Observable<any> {
    let params = new HttpParams();
    Object.keys(criteria).forEach(key => {
      if (criteria[key]) params = params.set(key, criteria[key]);
    });
    return this.http.get(`${this.baseUrl}/find`, { params });
  }

  getUserById(id:any): Observable<any>{
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  updateUser(id:any,userData:any): Observable<any>{
    return this.http.patch(`${this.baseUrl}/${id}`,userData);
  }
  
  getDahsboardData(): Observable<any>{
    return this.http.get(`${this.lookupUrl}/dashboard`);
  }

  getLookupData(): Observable<any> {
    return this.http.get(`${this.lookupUrl}`);
  }

 /**
   * Fetch table schema (existing method)
   * GET /api/users/tableSchema?tableName=...
   * Expected: columns array OR { columns: [...], rows: [...] }
   */
  getTableDetails(tableName: string): Observable<any> {
    let params = new HttpParams().set('tableName', tableName);
    return this.http.get(`${this.baseUrl}/tableSchema`, { params });
  }

  /**
   * Fetch table rows (if schema endpoint doesn't return rows).
   * GET /api/users/tableData?tableName=...
   * Adjust endpoint path if your backend exposes a different route.
   */
  getTableRows(tableName: string): Observable<any> {
    let params = new HttpParams().set('tableName', tableName);
    return this.http.get(`${this.baseUrl}/tableData`, { params });
  }

  /**
   * Create / Update / Delete helpers (assumed endpoints)
   * Adjust backend route signatures if needed.
   */
  createTableRecord(tableName: string, data: any) {
    return this.http.post(`${this.baseUrl}/table`, { tableName, data });
  }

  updateTableRecord(tableName: string, id: any, data: any) {
    return this.http.put(`${this.baseUrl}/table/${id}`, { tableName, data });
  }

  deleteTableRecord(tableName: string, id: any) {
    return this.http.request('delete', `${this.baseUrl}/table/${id}`, { body: { tableName } });
  }

  getAllUserAccess(): Observable<any> {
    return this.http.get(`${this.userAccessUrl}`);
  }
  deleteUser(id:any): Observable<any>{
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  sendPasswordResetEmail(email: string): Observable<any> {
    return this.http.post(`${this.userAccessUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, userId: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.userAccessUrl}/reset-password`, { token, userId, newPassword });
  }
}
