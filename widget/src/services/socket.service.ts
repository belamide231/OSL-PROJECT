import { Injectable } from '@angular/core';
import { Socket as SocketServer, io } from 'socket.io-client';
import { dns } from '../environment/dns';
import { DataService } from './data.service';
import { ModiferService } from './modifier.service';


@Injectable({
  providedIn: 'root'
})
export class SocketService {
  constructor(private readonly Data: DataService, private readonly Modifier: ModiferService) {
    const Socket = io(dns, { withCredentials: true });
    if(!Socket) return;

    Socket.on('connected', () => 
      this.SocketEvents(Socket as SocketServer));  
  }

  SocketEvents(Socket: SocketServer): void {
    Socket.emit('chats-delivered');

    Socket.on('new-message', (ChatId: number) => 
      Socket.emit('fetch-message', {
        Exists: this.Modifier.IsChatExists(ChatId),
        ChatId
      }));

    Socket.on('fetched-message', async (Chat: any) => {
      const Inserted: boolean = await this.Modifier.InsertMessage(Chat);
      Inserted && this.Data.CurrentChat === Chat.Messages[0].chat_id?
        Socket.emit('chat-seen', Chat.Messages[0].chat_id):
        Socket.emit('chat-delivered', Chat.Messages[0].chat_id);
    });

    Socket.on('mark-status-as-delivered', (Status) => 
      this.Modifier.UpdateMemberStatus(Status));

    Socket.on('mark-status-as-seen', (Status) => 
      this.Modifier.UpdateMemberStatus(Status));
   
  }
}
