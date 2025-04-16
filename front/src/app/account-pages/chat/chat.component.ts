import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { aSidebarComponent } from '../sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';
import { DataService } from '../../services/data.service';
import { ModifierService } from '../../services/modifier.service';


@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, aSidebarComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})

export class ChatComponent {
  constructor(
    public Data: DataService,
    public readonly Modifier: ModifierService,
    private readonly Api: ApiService) {}
}
