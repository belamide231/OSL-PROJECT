import { Component } from '@angular/core';
import { ApiService } from '../../services/services.configuration/api.service';
import { SocketService } from '../../services/services.configuration/socket.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent {
  public username: string = '';
  public password: string = '';

  constructor(public api: ApiService) {}

  public register = () => {
    this.api.register(this.username, this.password).subscribe(response => {
      console.log(response);
    });
  }
}
