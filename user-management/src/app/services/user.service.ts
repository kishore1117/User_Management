import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://192.168.1.247:3000/api/users';

  constructor(private http: HttpClient) {}

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
}
