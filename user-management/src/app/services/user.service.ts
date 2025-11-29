import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:3000/api/users';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}`);
  }

  addUser(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}`, userData);
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
}
