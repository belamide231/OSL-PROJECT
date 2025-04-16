import { Component } from '@angular/core';
import{ SidebarComponent } from '../sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [SidebarComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  constructor(
    private readonly api: ApiService) {}
}
