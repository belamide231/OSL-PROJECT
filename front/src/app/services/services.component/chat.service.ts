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


  constructor(private readonly api: ApiService, private readonly socket: SocketService) {
    this.api.loadChatList(this.chatList.length).subscribe((response: any) => {
      console.log(response);
      this.chatList = response.chatList;
    });
  }
}
