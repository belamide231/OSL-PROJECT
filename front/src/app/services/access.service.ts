import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AccessService {
  private Authenticated: boolean = false;
  private Authorized: boolean = false;
  private Company: string = 'ibc';

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
    const keys = Object.keys(ThemeInformation);
    keys.forEach(key => {
      const elementKey = `--${key.replace('_', '-')}`;
      const valueOfKey = ThemeInformation[key];
      document.documentElement.style.setProperty(elementKey, valueOfKey);
    });
  }
}
