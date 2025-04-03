import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { ApiService } from '../../services/services.configuration/api.service';
import { SocketService } from '../../services/services.configuration/socket.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {

  constructor(public readonly data: DataService) {}

  ngOnInit(): void {}

}
