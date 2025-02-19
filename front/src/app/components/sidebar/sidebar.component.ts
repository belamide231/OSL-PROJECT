import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule,CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})

export class SidebarComponent implements OnInit {
  isCollapsed: boolean;

  constructor(private router: Router, private readonly api: ApiService) {
    // Retrieve the saved sidebar state from local storage on initialization
    const savedState = localStorage.getItem('sidebarState');
    this.isCollapsed = savedState ? JSON.parse(savedState) : false;
  }

  ngOnInit(): void {
    // Optionally, you can listen to route changes to handle other side effects.
    this.router.events.subscribe(() => {
      // Keep the sidebar state intact across route changes
    });
    
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

  logout(): void {
    // Clear the login state from localStorage
    // localStorage.removeItem('isLoggedIn');
    // Redirect to login page
    // this.router.navigate(['/login']);

    this.api.logout().subscribe(res => res ? alert(res) : this.router.navigate(['/login']));
    console.log("UBOS");
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    // Save the updated state to local storage
    localStorage.setItem('sidebarState', JSON.stringify(this.isCollapsed));
  }
}

