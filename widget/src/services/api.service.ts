import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { host } from '../utilities/host';
import { headers } from '../utilities/headers';
import { GeoLocation } from '../utilities/geolocation';
import { ThemeInitiator } from '../utilities/themeInitiator';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(
    private readonly Http: HttpClient,
    private readonly Socket: SocketService,
    public Data: DataService) {
      this.WidgetInitialization();
  }

  async WidgetInitialization(): Promise<void> {
    const UserLocation = await GeoLocation();
    this.GetCompanyThemeForCostumers(UserLocation);
  }

  async GetCompanyThemeForCostumers(address: { country: string, city: string, street: string } | {}): Promise<void> {
    try {
      const Response = await firstValueFrom(this.Http.post(host('/customer/company/theme'), address, headers)) as any;
      if(Response.status === 200) {
        const ThemeInitialized = await ThemeInitiator(Response.body.theme);

        if(ThemeInitialized) {
          this.Data.Company = Response.body.company;
          this.Data.Page = 'Home';
          console.log("Connecting");

          this.Socket.Connect();
        }
      }
    } catch(error) {
      console.log('Error', error);
    }
  }

  // function getAvailableAccountsInASpecificCompanyApi(): Observable<any> {
  //   return this.http.post(API.endpoint('get/active/accounts'), null, API.headers()).pipe(map((response: any) => {
  //     return JSON.parse(response.body);
  //   }), catchError((error) => {
  //     return of(error.status);
  //   }));
  // }
}
