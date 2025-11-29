import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";

@Injectable({ providedIn: 'root' })
export class SoftwareService {
     private baseUrl = 'http://localhost:3000/api/software';
    constructor(private http: HttpClient){}

  getAllSoftware():Observable<any>{
      return this.http.get<any>(this.baseUrl);
  }
}