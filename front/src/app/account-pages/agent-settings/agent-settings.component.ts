import { Component } from '@angular/core';
import { aSidebarComponent } from "../sidebar/sidebar.component";
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-agent-settings',
  standalone: true,
  imports: [aSidebarComponent],
  templateUrl: './agent-settings.component.html',
  styleUrl: './agent-settings.component.css'
})
export class AgentSettingsComponent {
   constructor(public readonly data: DataService) {}
}