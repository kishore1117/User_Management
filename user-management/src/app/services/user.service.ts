import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:3000/api/users';
  private lookupUrl = 'http://localhost:3000/api/lookupData';
  private userAccessUrl = 'http://localhost:3000/api/user-access';

  constructor(private http: HttpClient) {}

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
    return this.http.get(`http://localhost:3000/api/download`, { responseType: 'blob' });
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
}
