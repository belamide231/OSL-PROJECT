import { Component } from '@angular/core';
import { DataService } from '../../../services/data.service';
import { SocketService } from '../../../services/socket.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  constructor(private data: DataService, private socket: SocketService) {
  }
}
