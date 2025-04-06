import { Injectable } from '@angular/core';
import { ApiService } from '../services.configuration/api.service';
import { SocketService } from '../services.configuration/socket.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  public activeScopedUser = [
    'timoy',
    'helsi',
    'bensoy',
    'charles',
    'hitler',
    'ash'
  ];
  public chatList = [];
  public isChatmateTyping = false;

  constructor(public readonly api: ApiService, public readonly socket: SocketService) {

    this.api.loadChatList(this.chatList.length).subscribe((response: any /* { chatList: any[], order: any[] } */) => {
      this.chatList = response.chatList;
    });

    this.socket.isTyping.subscribe(x => this.isChatmateTyping = x);
  }
}
