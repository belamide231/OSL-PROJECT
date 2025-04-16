import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { GuardApiService } from '../services/guard.api.service';
import { firstValueFrom } from 'rxjs';
import { AccessService } from '../services/access.service';

@Injectable({ providedIn: 'root' })
export class AuthorizationGuard implements CanActivate {
  constructor(
    private api: GuardApiService,
    private access: AccessService,
    private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    if(this.access.GetAuthorization()) {
      return true;
    }

    const data = route.data as any;
    if(!data.RequiredRole) {
      this.router.navigate(['/login']);
      return false;
    }

    const status = await firstValueFrom(this.api.VerifyAuthorization(data.RequiredRole));
    if(status !== 200) {
      this.router.navigate(['/login']);
      return false;
    }

    this.access.ChangeAuthorization(true);
    return true;
  }
}
