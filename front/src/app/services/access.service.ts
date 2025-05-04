import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AccessService {
  Authenticated: boolean = false;
  Authorized: boolean = false;
  Company: string = 'ibc';

  ChangeAuthentication(Authentication: boolean): void {
    this.Authenticated = Authentication;
  }
  GetAuthentication(): boolean {
    return this.Authenticated;
  }

  ChangeAuthorization(Authorization: boolean): void {
    this.Authorized = Authorization;
  }
  GetAuthorization(): boolean {
    return this.Authorized;
  }

  SetCompany(Company: string) {
    this.Company = Company;
  }
  RemoveCompany() {
    this.Company = '';
  }

  SetTheme(ThemeInformation: any): void {
    Object.keys(ThemeInformation).forEach(key => 
      document.documentElement.style.setProperty(key, ThemeInformation[key]));
  }
}
