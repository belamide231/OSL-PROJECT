import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {

  constructor(private readonly api: ApiService, private readonly socket: SocketService) {}

  ngOnInit(): void {
    // const themeColors = localStorage.getItem('themeColors');
    // if (themeColors) {
    //   const colors = JSON.parse(themeColors);
    //   document.documentElement.style.setProperty('--primary-color', colors.primary);
    //   document.documentElement.style.setProperty('--secondary-color', colors.secondary);
    //   document.documentElement.style.setProperty('--accent-color', colors.accent);
    // }

    this.api.theme().subscribe((res: any) => {
      if(isFinite(res)) 
        return;

      document.documentElement.style.setProperty('--primary-color', res.primary_color);
      document.documentElement.style.setProperty('--secondary-color', res.secondary_color);
      document.documentElement.style.setProperty('--accent-color', res.accent_color);
      document.documentElement.style.setProperty('--whites-color', res.whites_color);
    });
  }

}
