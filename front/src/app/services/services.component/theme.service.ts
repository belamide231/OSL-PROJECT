import { Injectable } from '@angular/core';
import { ApiService } from '../services.configuration/api.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  constructor(private readonly api: ApiService) { 
    this.api.theme().subscribe((res: any) => {
      if(isFinite(res)) {
        return;
      }

      document.documentElement.style.setProperty('--primary-color', res.primary_color);
      document.documentElement.style.setProperty('--secondary-color', res.secondary_color);
      document.documentElement.style.setProperty('--accent-color', res.accent_color);
      document.documentElement.style.setProperty('--whites-color', res.whites_color);
    });
  }
}
