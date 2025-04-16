import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { GuardApiService } from "../services/guard.api.service";
import { firstValueFrom } from "rxjs";

@Injectable({ providedIn: 'root' })
export class HasKeyGuard implements CanActivate {
  constructor(
    private api: GuardApiService,
    private router: Router) {}

  async canActivate(): Promise<boolean> {
    const response = await firstValueFrom<any>(this.api.HasKey());
    if(response.status !== 200) {
        this.router.navigate([({
            admin: '',
            account: '/adashboard'
        } as any)[response.error.role]]);
        return false;
    }

    return true;
  }
}
