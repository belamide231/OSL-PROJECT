import { Component } from '@angular/core';
import { DataService } from '../../../services/data.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChatModifierService } from './chat.data.modifier.service';
import { CloseComponent } from "../../modals/close/close.component";

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, CloseComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  constructor(
    public Data: DataService,
    public readonly Modifier: ChatModifierService) {}
}
