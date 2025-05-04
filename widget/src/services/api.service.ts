import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { host } from '../utilities/host';
import { headers } from '../utilities/headers';
import { GeoLocation } from '../utilities/geolocation';
import { ThemeInitiator } from '../utilities/themeInitiator';
import { ModiferService } from './modifier.service';


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private readonly Http: HttpClient, private readonly Modifier: ModiferService, public Data: DataService) {
    this.FetchCompanyTheme();
    this.FetchCompanyAgents();
  }

  async FetchCompanyTheme(): Promise<void> {
    try {

      const Location = await GeoLocation();
      const Response = await firstValueFrom(this.Http.post(host('/fetch/company/theme/forCustomer'), Location, headers)) as any;
      if(Response.status !== 200) return;

      const ThemeInitialized = await ThemeInitiator(Response.body.theme);
      if(!ThemeInitialized) return;

      this.Data.Company = Response.body.company;
      this.Data.Page = 'Home';

    } catch(error) {

      console.log('FetchCompanyTheme', error);
    }
  }

  async FetchCompanyAgents(): Promise<void> {
    try {

      const Response = await firstValueFrom(this.Http.post(host('/fetch/company/agents/forCustomer'), null, headers)).then(response => response.body);
      console.log(Response);

    } catch (error) {

      console.log('FetchCompanyAgents', error);
    }
  }

}
