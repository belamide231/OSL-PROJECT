import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { HttpClient } from '@angular/common/http';
import { APIConfiguration as API } from '../utilities/apiConfigurations';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {


  constructor(private http: HttpClient) {}


  public getCompanyThemeForUnauthenticatedUsersService = (address: { country: string, city: string, street: string } | {}): Observable<number | { primary_color: string, secondary_color: string, whites_color: string }> => {
    return this.http.post(API.endpoint('unauthenticated/company/theme'), address, API.headers()).pipe(map((response: any) => {
      return JSON.parse(response.body);
    }), catchError((error) => {
      return of(error.status);
    }));
  }
}
