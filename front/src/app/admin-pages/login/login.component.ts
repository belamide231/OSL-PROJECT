import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  message: string = '';
  username: string = '';
  password: string = '';

  constructor(
    private readonly api: ApiService,
    private readonly router: Router) {}

  public login(): void {
    this.api.userLogin(this.username, this.password).subscribe((response): any => {
      if(response.status !== 200) {
        return this.message = 'Invalid username or password';
      }
      const body = JSON.parse(response.body);
      this.router.navigate([({  
        'admin': '/',
        'account': '/adashboard'
      } as any)[body.role]]);
    });
  }
}
