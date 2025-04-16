import { Component } from '@angular/core';
import { DataService } from '../../../services/data.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'modal-close-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './close.component.html',
  styleUrl: './close.component.css'
})
export class CloseComponent {
  constructor(public Data: DataService) {}
}
