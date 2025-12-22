import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: 'root' })
export class SoftwareService {
     private baseUrl = `${environment.apiBaseUrl}/software`;
    constructor(private http: HttpClient){}

  getAllSoftware():Observable<any>{
      return this.http.get<any>(this.baseUrl);
  }
}