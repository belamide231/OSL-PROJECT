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


  public getCompanyThemeForUnauthenticatedService = (): Observable<any> => {
    
    return this.http.post(API.endpoint('unauthenticated/company/theme'), null, API.headers()).pipe(map((response: any) => {

      return JSON.parse(response.body);

    }), catchError((error) => {

      return of(error.status);
    }));
  }
}
