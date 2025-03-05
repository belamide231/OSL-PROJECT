import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';

import { DatabaseService } from './database.service';
import { ApiService } from './api.service';
import { dns } from '../../environment/dns';
import { AudioService } from './audio.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  
  
  private socket: Socket;


  private _chatList: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  public chatList: Observable<any[]> = this._chatList.asObservable();


  private _actives: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  public actives: Observable<any[]> = this._actives.asObservable();


  private _isTyping: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isTyping: Observable<boolean> = this._isTyping.asObservable();

  private _typingChatmates: number[] = [];

  public chatmateId: number = 0;


  constructor(private readonly api: ApiService, private readonly database: DatabaseService, private readonly audio: AudioService) { 


    this.socket = io(dns, { withCredentials: true });


    this.socket.on('connected', () => {
      this.loadChatList();
      this.api.loadActiveClients().subscribe(res => {
        this._actives.next(res);
      });
    });


    this.socket.on('someone joined', (client: any) => {
      const actives = this._actives.value;
      if(!Array.isArray(actives)) {
        return;
      }

      const index = actives.findIndex((x: any): any => {
        if(x !== null && x.id !== undefined) {
          return x.id === client.id
        }
      });

      if(index !== -1) {
        return;
      }

      const updatedActives: any = this._actives.value.push(client);
      this._actives.next(updatedActives);
    })


    this.socket.on('receive message', async (data) => {

      if(!data.chatmateId) {
        return;
      }

      this.api.loadMessage(data.messageId, data.chatmateId).subscribe((res: any) => {

        const chatIndex = this._chatList.value.findIndex((x: any) => x[0].chatmate_id === res.chatmate_id);
        if(chatIndex === -1) {
          return;
        }

        const previousChatlist = this._chatList.value;
        const updatedChat = this._chatList.value[chatIndex];

        previousChatlist.splice(chatIndex, 1);
        updatedChat.unshift(res);

        previousChatlist.unshift(updatedChat);
        this._chatList.next(previousChatlist);

        if(res.sender_id === res.chatmate_id) {
          this.messageDelivered();
        };
      });
    });


    this.socket.on('message delivered', (data) => {
      
      const previousChatList = this._chatList.value;
      const targetChat = previousChatList.findIndex(x => x[0].chatmate_id === data.chatmateId);

      if(targetChat === -1) {
        return;
      }

      previousChatList[targetChat].map((x: any) => {
        if(x.chatmate_id !== x.sender_id && x.content_status === 'sent' && new Date(x.sent_at) <= new Date(data.stamp)) {
          x.content_status = 'delivered', x.delivered_at = data.stamp;
        }

        return x;
      });

      this._chatList.next(previousChatList);

      const targetMessage = this._chatList.value[this._chatList.value.findIndex(x => x[0].chatmate_id === this.chatmateId)][0];
      if(targetMessage.chatmate_id !== this.chatmateId) {
        return
      }

      const userId = targetMessage.sender_id !== targetMessage.chatmate_id ? targetMessage.sender_id : targetMessage.receiver_id;
      if(userId === data.currentChatmateId) {
        this.seenChat(targetMessage.chatmate_id, true);
      }
    });


    this.socket.on('seen message', (data) => {

      const chatList = this._chatList.value;
      const chatIndex = chatList.findIndex(x => x[0].chatmate_id === data.chatmate_id);

      chatList[chatIndex].map((x: any) => {
        
        if(x.sender_id !== x.chatmate_id && ['delivered'].includes(x.content_status) && new Date(x.sent_at) <= new Date(data.timestamp)) {
          x.content_status = 'seen', x.seen_at = data.timestamp;
        }
        
        return x;
      });

      this._chatList.next(chatList);

      if(chatList[chatIndex][0].chatmate_id === this.chatmateId && chatList[chatIndex][0].sender_id === chatList[chatIndex][0].chatmate_id) {

        chatList[chatIndex].map((x: any) => {

          if(x.sender_id === x.chatmate_id && ['delivered', 'sent'].includes(x.content_status) && new Date(x.sent_at) <= new Date(data.timestamp)) {
            x.content_status = 'seen';
          }

          return x;
        });

        this._chatList.next(chatList);
        
        // data.notify && this.audio.playMessage();
      }
    });


    this.socket.on('typing message', (typingChatmateId: number) => {
      this._typingChatmates.push(typingChatmateId);
      if(this._typingChatmates.indexOf(typingChatmateId) === -1) {
        return;
      }

      this._typingChatmates.includes(typingChatmateId) && this.chatmateId === typingChatmateId ? this._isTyping.next(true) : this._isTyping.next(false);
    });


    this.socket.on('blank message', (typingChatmateId: number) => {
      const index = this._typingChatmates.indexOf(typingChatmateId);
      
      if(index === -1) {
        return;
      }

      this._typingChatmates.splice(index, 1);
      
      if(typingChatmateId === this.chatmateId) {
        this._isTyping.next(false);
      }
    });


    this.socket.on('disconnected', (disconnectingId: number) => {

      if(disconnectingId === this.chatmateId) {
        this._isTyping.next(false);
      }

      const actives = this._actives.value;

      if(!Array.isArray(actives)) {
        return;
      }

      const index = actives.findIndex((x: any): any => {
        if(x !== null && x.id !== undefined) {
          return x.id === disconnectingId;
        }
      });
      if(index === -1) {
        return;
      }
      
      actives.splice(index, 1);
      this._actives.next(actives);
    });
  }


  public seenChat = (chatmateId: number, notify: boolean) => {

    this.socket.emit("seen chat", { chatmateId, notify });
  }


  public messageDelivered = () => {

    this.socket.emit("message delivered", this.chatmateId);
  }


  public typingMessage = () => {

    this.socket.emit("typing message", this.chatmateId);
  }


  public checkIfChatmateIsTyping = (chatmateId: number) => {

    this._typingChatmates.includes(chatmateId) ? this._isTyping.next(true) : this._isTyping.next(false);
  }


  public blankMessage = () => {

    this.socket.emit("blank message", this.chatmateId);
  }


  private loadChatList = () => {
    this.api.loadChatList(this._chatList.value.length).subscribe(async (res: any) => {

      if(isFinite(res)) {
        return alert('Something went wrong with your internet');
      }

      this.messageDelivered();
      this._chatList.next(res.chatList);

      const targetMessage = this._chatList.value[this._chatList.value.findIndex(x => x[0].chatmate_id === this.chatmateId)][0];
      if(targetMessage.chatmate_id !== this.chatmateId) {
        return;
      }

      const seener = targetMessage.chatmate_id !== targetMessage.sender_id ? targetMessage.sender_id : targetMessage.receiver_id;
      if(seener === targetMessage.sender_id) {
        return;
      }

      this.seenChat(targetMessage.chatmate_id, false);
    });
  }
}
