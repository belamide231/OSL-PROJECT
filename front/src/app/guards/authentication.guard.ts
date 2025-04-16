import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { GuardApiService } from '../services/guard.api.service';
import { firstValueFrom } from 'rxjs';
import { AccessService } from '../services/access.service';

@Injectable({ providedIn: 'root' })
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly api: GuardApiService,
    private readonly access: AccessService,
    private readonly router: Router) {}

  async canActivate(): Promise<boolean> {
    if(this.access.GetAuthentication()) {
      return true;
    }

    const status = await firstValueFrom(this.api.VerifyAuthentication());
    if(status !== 200) {
      this.router.navigate(['/login']);
      return false;
    }

    this.access.ChangeAuthentication(true);
    return true;
  }
}
