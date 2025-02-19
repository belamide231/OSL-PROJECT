import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent {
  constructor(private readonly socket: SocketService) {}
}
