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

    this.socket.on('notifyReceiverHisNewMessage', async (data) => {

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
          this.notifyBackendThatMessageIsBeingReceived(data.chatmateId);
        };
      });
    });


    this.socket.on('notifySenderThatTheMessageIsBeingDelivered', (data: { receiverId: number, stamp: Date }) => {

      const modifiedChatListValue = this._chatList.value;
      const isChatListUpdated = (() => {
        let updated = false;
        const chatIndex = modifiedChatListValue.findIndex((element): any => {
          if(element) {
            return element[0].sender_id === data.receiverId || element[0].receiver_id === data.receiverId
          }
        });
        if(chatIndex === -1) {
          return updated;
        }

        const messageIndex = modifiedChatListValue[chatIndex].findIndex((element: any): any => {
          if(element) {
            return element.receiver_id = data.receiverId;
          }
        });
        if(messageIndex === -1) {
          return updated;
        }

        modifiedChatListValue[chatIndex].map((element: any) => {
          if(element.receiver_id === data.receiverId && element.content_status === 'sent') {
            element.content_status = 'delivered';
            element.delivered_at = data.stamp;
            updated = true;
          }
        });
        return updated;
      })();
      if(isChatListUpdated) {
        this._chatList.next(modifiedChatListValue);
      }
    });

    this.socket.on('notifySenderThatChatIsBeingSeen', (data: { timestamp: string, receiverId: number }) => {

      const modifiedChatListValue = this._chatList.value;
      const isChatListUpdated = (() => {
        let updated = false;
        const chatIndex = modifiedChatListValue.findIndex((element): any => {
          if(element) {
            return element[0].sender_id === data.receiverId || element[0].receiver_id === data.receiverId
          }
        });
        if(chatIndex === -1) {
          return updated;
        }

        const messageIndex = modifiedChatListValue[chatIndex].findIndex((element: any): any => {
          if(element) {
            return element.receiver_id = data.receiverId;
          }
        });
        if(messageIndex === -1) {
          return updated;
        }

        modifiedChatListValue[chatIndex].map((element: any) => {
          if(element.receiver_id === data.receiverId && ['sent', 'delivered'].includes(element.content_status)) {
            element.content_status = 'seen';
            element.seen_at = data.timestamp;

            if(element.delivered_at === null) {
              element.delivered_at = data.timestamp;
            }

            updated = true;
          }
        });
        return updated;
      })();
      if(isChatListUpdated) {
        this._chatList.next(modifiedChatListValue);
      }
    });


    //this.socket.on('notifyReceiverThatChatIsBeingSeen', (data: {  })) 


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


  public notifyBackendThatChatIsBeingSeen = () => {

    const receiverTrackedChatmate = this.chatmateId;
    this.socket.emit('notifyBackendThatChatIsBeingSeen', receiverTrackedChatmate);
  }

  public notifyBackendThatMessageIsBeingReceived = (senderId: number | null) => {
    const receiverCurrentChatmateId = this.chatmateId;

    if(senderId === null) {

      this.socket.emit('notifyBackendThatAllChatIsBeingReceived', receiverCurrentChatmateId);
      return;
    }

    if(receiverCurrentChatmateId === senderId) {

      this.socket.emit('notifyBackendThatChatIsBeingSeen', senderId);

      this.markChatHeadAsSeen(senderId);

    } else {

      this.socket.emit('notifyBackendThatChatIsBeingReceived', senderId);
    }
  }


  public typingMessage = () => {

    this.socket.emit('typing message', this.chatmateId);
  }


  public checkIfChatmateIsTyping = (chatmateId: number) => {

    this._typingChatmates.includes(chatmateId) ? this._isTyping.next(true) : this._isTyping.next(false);
  }


  public blankMessage = () => {

    this.socket.emit('blank message', this.chatmateId);
  }


  private loadChatList = () => {
    this.api.loadChatList(this._chatList.value.length).subscribe(async (res: any) => {

      if(isFinite(res)) {
        return alert('Something went wrong with your internet');
      }

      this.notifyBackendThatMessageIsBeingReceived(null);
      this._chatList.next(res.chatList);

      const targetMessage = this._chatList.value[this._chatList.value.findIndex(x => x[0].chatmate_id === this.chatmateId)][0];
      if(targetMessage.chatmate_id !== this.chatmateId) {
        return;
      }

      const seener = targetMessage.chatmate_id !== targetMessage.sender_id ? targetMessage.sender_id : targetMessage.receiver_id;
      if(seener === targetMessage.sender_id) {
        return;
      }

      this.notifyBackendThatChatIsBeingSeen();
    });
  }

  public markChatHeadAsSeen = (senderId: number) => {

    const modifiedChatListValue = this._chatList.value;
    const chatIndex = modifiedChatListValue.findIndex((element): any => {
      if(element) {
        return element[0].sender_id === senderId
      }
    });

    console.log(chatIndex);

    modifiedChatListValue[chatIndex][0].content_status = 'seen';
    this._chatList.next(modifiedChatListValue);
  }

  public loadMoreMessages = (existingMessageLength: number, chatmateId: number) => {
    this.api.loadMoreMessages(existingMessageLength, chatmateId).subscribe(res => {

      if(Array.isArray(res) && res.length > 0) {
        
        const modifiedChatList = this._chatList.value;
        const chatIndex = modifiedChatList.findIndex((chat): any => {
          if(chat && chat[0]) {
            return chat[0].chatmate_id === chatmateId;
          }
        })

        if(chatIndex === -1) {
          return;
        }

        modifiedChatList[chatIndex] = modifiedChatList[chatIndex].concat(res);
        this._chatList.next(modifiedChatList);
      }
    });
  }
}
