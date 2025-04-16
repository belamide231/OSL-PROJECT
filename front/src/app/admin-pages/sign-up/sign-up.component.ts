import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent {
  constructor(
    private readonly api: ApiService, 
    private readonly router: Router) { }
  public success: boolean = false;
  message = '';
  username: string = '';
  password: string = '';
  verifyPassword: string = '';
  
  public userRegistration(): void {
    this.api.userRegistration(this.username, this.password, this.verifyPassword).subscribe((response: any) => {
      if(response === 200) {
        this.success = true;
        this.message = 'Account successfully created';
      } else {
        this.message = response.message;
      }
    });
  }
  public navigateLogin(): void {
    this.router.navigate(['/login']);
  }
}
