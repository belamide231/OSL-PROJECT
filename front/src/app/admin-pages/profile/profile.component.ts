import { Component, OnInit } from '@angular/core';
import{ SidebarComponent } from '../sidebar/sidebar.component';
import { ApiService } from '../../services/services.configuration/api.service';
import { SocketService } from '../../services/services.configuration/socket.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  constructor(public readonly data: DataService) {}
  ngOnInit(): void {
  }
}
