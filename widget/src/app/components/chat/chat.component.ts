import { Component } from '@angular/core';
import { DataService } from '../../../services/data.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {

  constructor(private data: DataService) {}
}
