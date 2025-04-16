import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { AccessService } from '../../services/access.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})

export class SidebarComponent {
  isCollapsed: boolean;

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly socket: SocketService,
    private readonly access: AccessService
  ) {
    const savedState = localStorage.getItem('sidebarState');
    this.isCollapsed = savedState ? JSON.parse(savedState) : false;
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('sidebarState', JSON.stringify(this.isCollapsed));
  }

  logout(): void {
    this.api.userLogout().subscribe((response): any => {
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

