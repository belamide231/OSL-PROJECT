import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import * as Interfaces from '../interfaces/interface';

@Injectable({
  providedIn: 'root'
})
export class ModiferService {
  constructor(public Data: DataService) { }

  AttachFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if(file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.Data.CurrentAttachedFile = reader.result;
      };
      reader.readAsDataURL(file);    
    }
  }

  IsChatExists(ChatId: number): boolean {

    const Index = this.Data.Chats.findIndex((Chat: {
      Messages: any,
      Status: any
    }) => Chat.Messages[0].chat_id === ChatId);

    return Index === -1 ? false : true;
  }
  
  async InsertMessage(Chat: any): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if(Chat.Status) {
        this.Data.Chats = [Chat, ...this.Data.Chats];
        return resolve(true);
      }
  
      const Index = this.Data.Chats.findIndex((Chat: any) => Chat.Messages[0].chat_id === Chat.Messages[0].chat_id);
      if(Index === -1) return resolve(false);
        
      this.Data.Chats[Index].Messages = [Chat.Messages[0], ...this.Data.Chats[Index].Messages];
      const HeldChat = this.Data.Chats[Index];
  
      this.Data.Chats.splice(Index, 1);
      this.Data.Chats = [HeldChat, ...this.Data.Chats];
      return resolve(true);
    });
  }

  UpdateMemberStatus(Status: any) {

    const CIndex = this.Data.Chats.findIndex(Chat => Chat.Messages[0].chat_id === Status.chat_id);
    if(CIndex === -1) return;

    const MIndex = this.Data.Chats[CIndex].Status.findIndex(Member => Member.member_id === Status.member_status.member_id);
    if(MIndex === -1) return;    

    this.Data.Chats[CIndex].Status[MIndex] = Status.member_status;
    console.log(this.Data.Chats);
  }
}
