import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/services.configuration/api.service';
import { SocketService } from '../../services/services.configuration/socket.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private router: Router, private readonly api: ApiService, private readonly socket: SocketService) {}

  ngOnInit(): void {
  }

  login = () => {

    this.api.login(this.username, this.password).subscribe((response: string) => {
      if(!['admin', 'account'].includes(response)) {
        this.errorMessage = response;
      }
      this.router.navigate([{
        admin: '/dashboard',
        account: '/adashboard'
      }[response]]);
    });
  }
}
