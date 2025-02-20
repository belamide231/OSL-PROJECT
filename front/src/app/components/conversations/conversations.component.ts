import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import relativeTime from 'dayjs/plugin/relativeTime';
import dayjs from 'dayjs';

dayjs.extend(relativeTime);

import { ChatService } from '../../services/chat.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './conversations.component.html',
  styleUrls: ['./conversations.component.css'],
})
export class ConversationComponent implements AfterViewInit {
  messages: { sender: string; message: string; time: string; type: 'sent' | 'received'; priority?: boolean; status?: 'open' | 'pending' | 'closed'; ipLocation: string }[] = [];
  newMessage: string = '';
  selectedCategory: string = 'all';
  selectedChat: { sender: string; message: string; time: string;  type: 'sent' | 'received'; priority?: boolean; status?: 'open' | 'pending' | 'closed'; ipLocation: string } | null = null;
  showOptions: boolean = false;
  loading: boolean = false;
  composeModal: boolean = false;
  attachmentModal: boolean = false;

  public chatListHeads: any = [];
  public chatList: any[] = [];
  public chat: any = [];
  public isChatmateTyping: boolean = false;
  public isTimePassed: number = 0;
  public isMessagesLoading: boolean = false;
  public isUserTyping: boolean = false;

  constructor(private chatService: ChatService, private readonly socket: SocketService, private readonly api: ApiService) {
    
    this.socket.isTyping.subscribe(x => this.isChatmateTyping = x);
  }


  ngAfterViewInit(): void {


    const chatContainer = document.getElementById("chatContainer");
    chatContainer?.addEventListener("scroll", () => {
      if(chatContainer.clientHeight + Math.abs(chatContainer.scrollTop) + 1 >= chatContainer.scrollHeight || chatContainer.clientHeight + Math.abs(chatContainer.scrollTop) >= chatContainer.scrollHeight) {
        if(this.isMessagesLoading)
          return;

        this.isMessagesLoading = true;
        this.api.loadMessages(this.chat.length, this.socket.chatmateId).subscribe(res => {
          
          this.chat = this.chat.concat(res);  
          this.isMessagesLoading = false;
        });
      }
    });

    this.fetchMessagesByCategory();

    this.api.theme().subscribe((res: any) => {
      if(isFinite(res)) 
        return;

      document.documentElement.style.setProperty('--primary-color', res.primary_color);
      document.documentElement.style.setProperty('--secondary-color', res.secondary_color);
      document.documentElement.style.setProperty('--accent-color', res.accent_color);
      document.documentElement.style.setProperty('--whites-color', res.whites_color);
    });

    this.socket.chatList.subscribe(chatList => {

      this.chatList = chatList as any;
      this.chatListHeads = chatList.map((x: any) => x[0]);

      if(chatList.length === 0)
        return;

      if(this.socket.chatmateId === 0) 
        this.socket.chatmateId = chatList[0][0].chatmate_id;

      this.chat = chatList[chatList.findIndex(x => x[0].chatmate_id === this.socket.chatmateId)];
    });
  }

  public getStatusAndStamp = (object: any): any => {

    if(object.status === 'sending') return 'sending';
    if(object.content_status === 'sent') return `${object.content_status} at ${this.getDate(object.sent_at)}`;
    if(object.content_status === 'delivered') return `${object.content_status} at ${this.getDate(object.delivered_at)}`;
    if(object.content_status === 'seen') return `${object.content_status} at ${this.getDate(object.seen_at)}`;
  }

  public timePassed = (stamp: string) => {
    return dayjs(stamp).fromNow();
  }

  public setTimePassed = (messageId: number) => {
    this.isTimePassed = messageId;
  }

  public deleteTimePassed = () => {
    this.isTimePassed = 0;
  }

  public selectChat = (chatmateId: number) => {
    if(this.socket.chatmateId === chatmateId)
      return;

    this.newMessage = '';
    this.socket.blankMessage();

    this.socket.chatmateId = chatmateId;
    this.socket.checkIfChatmateIsTyping(chatmateId);
    this.isUserTyping = false && this.newMessage !== '';

    this.chat = this.chatList[this.chatList.findIndex((x: any) => x[0].chatmate_id === this.socket.chatmateId)];
    
    const chatIndex = this.chatList.findIndex((x: any) => x[0].chatmate_id === chatmateId);
    if(chatIndex === -1) 
      return;

    if(this.chatList[chatIndex][0].content_status === 'seen')
      return;

    this.socket.seenChat(chatmateId, false);
  }

  public renderMessages = () => {

    let status = ['sent', 'delivered', 'seen'];
    let last = 0;
    let latestSentAt: string = '';

    const modified = this.chat as any;

    modified.forEach((x: any, i: number) => {

      if(x.chatmate_id !== x.sender_id && x.uuid === undefined) {
        if(status.includes(x.content_status)) {
          modified[i]['status'] = x.content_status;
          status.splice(status.indexOf(x.content_status), 1);
        } else {
          modified[i]['status'] = null;
        }
      }

      if(modified[i].sent_at) {
        if(latestSentAt === '') {
          latestSentAt = x.sent_at;
        } else {
          const latest = (new Date(latestSentAt)).getTime();
          latestSentAt = x.sent_at;

          const previous = (new Date(x.sent_at)).getTime();
          const elapsedSeconds = Math.floor((latest - previous) / 1000);

          const t = i-1;
          modified[t]['new_conversation'] = true && elapsedSeconds >= 60 * 60;
        }
      }

      if(last === 0) {

          modified[i]['top'] = 'curve';
          modified[i]['bottom'] = 'curve';
          last = x.sender_id;

        } else {

          const t = i-1;

          if(last === x.sender_id) {

            if(modified[t].new_conversation === true) {


              modified[t]['top'] = 'curve';
              modified[i]['bottom'] = 'curve';

            } else {

              modified[t]['top'] = 'narrow';
              modified[i]['bottom'] = 'narrow';
            }
          
          } else {

            modified[t]['top'] = 'curve';
            modified[i]['bottom'] = 'curve';

            last = x.sender_id;
          } 
      }

      if(i === modified.length-1) {
        modified[i]['top'] = 'curve';
      }

      return x;
    });


    return modified as any;
  }


  getDate = (sentAt: string) => {

    const stamp = new Date(sentAt);
    const current = new Date();
    const daysInWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthsInYears = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const time = `${stamp.getHours() === 0 ? '12': stamp.getHours() > 12 ? stamp.getHours() % 12 : stamp.getHours()}:${stamp.getMinutes() < 10 ? `0${stamp.getMinutes()}` : stamp.getMinutes() } ${stamp.getHours() > 12 ? 'PM': 'AM'}`;

    if(stamp.getDate() === current.getDate() && stamp.getMonth() === current.getMonth() && stamp.getFullYear() === current.getFullYear()) 
      return time;
    if(stamp.getDate() === (current.getDate() - 1) && stamp.getMonth() === current.getMonth() && stamp.getFullYear() === current.getFullYear()) 
      return `Yesterday ${time}`;
    if(stamp.getTime() < (current.getTime() - 2 * 24 * 60 * 60 * 1000) && stamp.getTime() > (current.getTime() - 7 * 24 * 60 * 60 * 1000) && stamp.getMonth() === current.getMonth() && stamp.getFullYear() === current.getFullYear())
      return `${daysInWeek[stamp.getDay()]} ${time}`;
    if((stamp.getMonth() !== current.getMonth() || stamp.getMonth() === current.getMonth()) && stamp.getFullYear() === stamp.getFullYear())
      return `${monthsInYears[stamp.getMonth()]} ${stamp.getDate()}, ${time}`;
    if(stamp.getFullYear() !== current.getFullYear())
      return `${monthsInYears[stamp.getMonth()]} ${stamp.getDate()}, ${stamp.getFullYear()}, ${time}`;
    return '';
  }
  
  eventType = () => {
    if(!this.isUserTyping && this.newMessage !== '') {
      this.isUserTyping = true;
      this.socket.typingMessage();
    } 

    if(this.isUserTyping && this.newMessage === '') {
      this.isUserTyping = false;
      this.socket.blankMessage();
    }
  }


  sendMessage = () => {
    if(this.newMessage !== '') {
      const UUID = uuidv4();

      const userId = this.chat[0].chatmate_id !== this.chat[0].sender_id ? this.chat[0].sender_id : this.chat[0].receiver_id;
      this.chat.unshift({ uuid: UUID, content: this.newMessage, status: 'sending', content_status: 'sending', sender_id: userId, receiver_id: this.socket.chatmateId });

      this.api.sendMessage(this.socket.chatmateId, this.newMessage, UUID).subscribe(res => {
        if(isFinite(res)) {
          alert('Something went wrong to our connection');
        } else {
          const indexToDelete = this.chat.findIndex((x: any) => x.uuid === res.uuid);
          if(indexToDelete === -1)
            return;

          this.chat.splice(indexToDelete, 1);
        }
      }); 
      this.newMessage = '';
      this.socket.blankMessage();
      this.isUserTyping = false;
    }
  }

  fetchMessagesByCategory(): void {
    console.log('fetchMessagesByCategory');
    this.loading = true;
    this.messages = this.chatService.getMessagesByType(this.selectedCategory);
    if (this.messages.length > 0) {
      this.selectedChat = { 
        sender: this.messages[0].sender, 
        message: this.messages[0].message, 
        time: this.messages[0].time, 
        priority: this.messages[0].priority, 
        status: this.messages[0].status, 
        ipLocation: this.messages[0].ipLocation ,
        type: this.messages[0].type
      };
    }
    this.loading = false;
  }

  changeCategory(category: string): void {
    console.log('changeCategory');
    this.selectedCategory = category;
    this.fetchMessagesByCategory();
  }


  editMessage(index: number): void {
    console.log('editMessage');
    const newMessage = prompt('Edit message:', this.messages[index].message);
    if (newMessage !== null) {
      this.chatService.editMessage(index, newMessage, this.selectedCategory);
      this.fetchMessagesByCategory();
    }
  }


  viewDetails(index: number): void {
    console.log('viewDetails');
    const message = this.messages[index];
    alert(`Message details:\nSender: ${message.sender}\nTime: ${message.time}\nMessage: ${message.message}\nLocation: ${message.ipLocation}`);
  }

  getLatestMessageTime(category: string): string {
    console.log('getLatestMessageTime');
    return this.chatService.getLatestTime(category);
  }

  selectMessage(message: { sender: string; message: string; time: string; type: 'sent' | 'received'; priority?: boolean; status?: 'open' | 'pending' | 'closed'; ipLocation: string }) {
    console.log('selectMessage');
    this.selectedChat = message;
  }
  addNotes(){
    console.log('addNotes');
    alert('Notes added')
  }
  viewTranscript(){
    console.log('viewTranscript');
    alert('Transcript viewed')
  }
  deleteMessage(){
    console.log('deleteMessage');
    alert('Message deleted')
  }
 

  toggleOptions(): void {
    console.log('toggleOptions');
    this.showOptions = !this.showOptions;
  }
  showComposeModal(){
    console.log('showComposeModal');
    this.composeModal = !this.composeModal;
  }
  closeComposeModal(){
    console.log('closeComposeModal');
    this.composeModal = false;
  }
  sendComposeMessage(){
    console.log('sendComposeMessage');
    alert('Message sent')
  }
  sendAttachment(){
    console.log('sendAttachment');
    this.attachmentModal = !this.attachmentModal;
  }
  uploadFiles(){
    console.log('uploadFiles');
    alert('Files uploaded')
  }



}

