import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { jwtDecode } from "jwt-decode";
import { HttpClient } from "@angular/common/http";

@Injectable({ providedIn: 'root' })
export class LocationService {
     private baseUrl = 'http://localhost:3000/api/locations';

    constructor(private http: HttpClient){}
  private selectedLocation = new BehaviorSubject<number | null>(
    Number(localStorage.getItem("admin_location_id")) || null
  );

  selectedLocation$ = this.selectedLocation.asObservable();

//   setLocation(locationId: number) {
//     localStorage.setItem("admin_location_id", String(locationId));
//     this.selectedLocation.next(locationId);
//   }

  getLocationIds(): any | null {
    const authToken = sessionStorage.getItem("authToken");
    if(authToken) {
        const decodedToken: any = jwtDecode(authToken);
        return decodedToken
    }
  }
  getLocations():Observable<any>{
      return this.http.get<any>(this.baseUrl);
  }
}
