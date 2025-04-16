import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { dns as BackendHostDNS } from '../../environment/dns';
import queryString from 'query-string';

const headers: any = {
    headers: { 
      'Content-Type': 
      'application/json' 
    }, 
    withCredentials: true, 
    observe: 'response' as 'response', 
    responseType: 'json' as 'json' 
}

function domain(path: string): string {
  return BackendHostDNS.slice(0, -1) + path;
}

@Injectable({
  providedIn: 'root'
})
export class GuardApiService {
  constructor(
    private readonly http: HttpClient,
  ) { }

  public VerifyInvitation(): Observable<number> {
    return this.http.post(domain('/user/invitation/proof'), { 'Invitation': queryString.parse(window.location.search)['invitation'] }, headers).pipe(
      map((response: any) => response.status),
      catchError((error: any) => of(error.status)));
  }

  public VerifyAuthentication(): Observable<number> {
    return this.http.post(domain('/user/authentication/proof'), null, headers).pipe(
      map((response: any) => response.status),
      catchError((error: any) => of(error.status)));
  }

  public VerifyAuthorization(RoleRequired: string): Observable<number> {
    return this.http.post(domain('/user/authentication/proof'), { RoleRequired }, headers).pipe(
      map((response: any) => response.status),
      catchError((error: any) => of(error.status)));
  }

  public HasKey(): Observable<any> {
    return this.http.post(domain('/user/hasKey'), null, headers).pipe(
      map((response: any) => response),
      catchError((error: any) => of(error)));
  }
}
