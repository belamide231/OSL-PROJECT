import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { SocketService } from './socket.service';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService { 
  constructor(private api: ApiService, private socket: SocketService) {}

  public getCompanyThemeForUnauthenticatedUsersService = (address: { country: string, city: string, street: string } | {}): Observable<string> => {
    return this.api.getCompanyThemeForUnauthenticatedUsersService(address).pipe(
      map((response: number | { primary_color: string, secondary_color: string, whites_color: string }) => {

        console.log(response);

        if(typeof response === 'number') {
          return response.toString();
        }

        Object.keys(response).forEach((key) => {
          document.documentElement.style.setProperty('--' + key, (response as any)[key]);          
        });

        return 'home';
      })
    );
  }


  
}
