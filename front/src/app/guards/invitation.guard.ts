import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { GuardApiService } from '../services/guard.api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InvitationGuard implements CanActivate {
  constructor(private api: GuardApiService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const status = await firstValueFrom(this.api.VerifyInvitation());
    if (status !== 200) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}