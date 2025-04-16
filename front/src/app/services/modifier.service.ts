import { Injectable } from '@angular/core';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class ModifierService {
  constructor(public Data: DataService) { }
  AttachFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.Data.Chat.CurrentAttachedFile = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
