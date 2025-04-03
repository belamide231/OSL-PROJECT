import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ApiService } from '../../services/services.configuration/api.service';
import { SocketService } from '../../services/services.configuration/socket.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent {
  constructor(public readonly data: DataService) {}
}
