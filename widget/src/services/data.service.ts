import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {

  constructor(private api: ApiService, private socket: SocketService) { 

    this.api.getCompanyThemeForUnauthenticatedService().subscribe((response: { primary_color: string, secondary_color: string, whites_color: string } | number): any => {

      if(isFinite(response as number)) {
        return null;
      }

      response = response as { primary_color: string, secondary_color: string, whites_color: string };
      const keys = Object.keys(response) as Array<keyof typeof response>;

      keys.forEach((key: keyof typeof response) => {
        const color = response[key];
        const modifiedKey = '--' + key.toString();
        document.documentElement.style.setProperty(modifiedKey, color);
      });

    });    

    
  }
}
