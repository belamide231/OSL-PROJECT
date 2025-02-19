import { Component } from '@angular/core';
import { aSidebarComponent } from "../sidebar/sidebar.component";
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-agent-notifications',
  standalone: true,
  imports: [aSidebarComponent],
  templateUrl: './agent-notifications.component.html',
  styleUrl: './agent-notifications.component.css'
})
export class AgentNotificationsComponent {
  constructor(private readonly socket: SocketService) {}
}
