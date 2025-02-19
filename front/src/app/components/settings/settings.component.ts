import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  constructor(private readonly socket: SocketService) {}
}
