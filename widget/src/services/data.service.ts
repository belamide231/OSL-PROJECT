import { Injectable } from '@angular/core';
import * as Interfaces from '../interfaces/interface';

@Injectable({
  providedIn: 'root',
})
export class DataService { 
  Modals = {
    CloseModalTriggered: false as boolean
  }

  Page: string | null = null;
  Company: string | null = null;

  CurrentAttachedFile: null | any = null;
  CurrentInputtedMessage: string = '';

  CurrentChat: number | null = null;
  Chats: Interfaces.ChatListInterface[] = [];
}
