import { Injectable } from '@angular/core';
import { ApiService } from '../services.configuration/api.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {

  constructor(private readonly api: ApiService, private readonly router: Router) { }

  public logout(): void {
    this.api.logout().subscribe(response => {
      if(response) {
        return alert(response);
      }
      this.router.navigate(['/login']);
    });
  }
}
