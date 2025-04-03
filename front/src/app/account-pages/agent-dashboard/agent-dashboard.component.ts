import { Component } from '@angular/core';
import { aSidebarComponent } from '../sidebar/sidebar.component';
import { DataService } from '../../services/data.service';
@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [aSidebarComponent],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.css'
})
export class AgentDashboardComponent {
  constructor(public data: DataService) {}
}
