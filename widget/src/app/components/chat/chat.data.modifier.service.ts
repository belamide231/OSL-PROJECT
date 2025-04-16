import { Injectable } from '@angular/core';
import { DataService } from '../../../services/data.service';

@Injectable({
  providedIn: 'root'
})
export class ChatModifierService {
  constructor(public Data: DataService) { }

  AttachFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if(file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.Data.Chat.CurrentAttachedFile = reader.result;
      };
      reader.readAsDataURL(file);    
    }
  }
}
