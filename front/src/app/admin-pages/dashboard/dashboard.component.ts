import { Component } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { OnInit } from '@angular/core';
import { ApiService } from '../../services/services.configuration/api.service';
import { SocketService } from '../../services/services.configuration/socket.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  constructor(private readonly data: DataService) {}
  ngOnInit(): void {
  }
}
