import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { AccessService } from '../../services/access.service';

@Component({
  selector: 'app-a-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class aSidebarComponent {
  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly socket: SocketService,
    private readonly access: AccessService
  ) {
    const savedState = localStorage.getItem('sidebarState');
    this.isCollapsed = savedState ? JSON.parse(savedState) : false;
  }

  isCollapsed: boolean;

  ngOnInit(): void {
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    // Save the updated state to local storage
    localStorage.setItem('sidebarState', JSON.stringify(this.isCollapsed));
  }

  logout(): void {
    this.api.userLogout().subscribe((response): any => {
      console.log(response);
      if(response.status !== 200) {
        return alert('Connection error');
      };
      this.router.navigate(['/login']);
      this.access.ChangeAuthentication(false);
      this.access.ChangeAuthorization(false);
      this.socket.Disconnect();
    });
  }
}

