import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import relativeTime from 'dayjs/plugin/relativeTime';
import dayjs from 'dayjs';

dayjs.extend(relativeTime);

import { SidebarComponent } from '../sidebar/sidebar.component';
import { ApiService } from '../../services/services.configuration/api.service';
import { SocketService } from '../../services/services.configuration/socket.service';
import { DataService } from '../../services/data.service';
import { ActiveUsersComponent } from '../../components/active-users/active-users.component';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, ActiveUsersComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements AfterViewInit {

  //  Limpyohonon

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
  public activesList = [
    'timoy',
    'helsi',
    'bensoy',
  ];

  constructor(private readonly socket: SocketService, private readonly api: ApiService, public readonly data: DataService) {
    this.socket.isTyping.subscribe(x => this.isChatmateTyping = x);
  }

  ngAfterViewInit(): void {
    const chatContainer = document.getElementById("chatContainer");
    // Balhinonon nis, ChatService
    chatContainer?.addEventListener("scroll", () => {

      if(chatContainer.clientHeight + Math.abs(chatContainer.scrollTop) + 1 >= chatContainer.scrollHeight || chatContainer.clientHeight + Math.abs(chatContainer.scrollTop) >= chatContainer.scrollHeight) {
        if(this.isMessagesLoading)
          return;

        this.isMessagesLoading = true;
        const existingMessageLength = this.chat.length;
        this.socket.loadMoreMessages(existingMessageLength, this.socket.chatmateId);
      }
    });

    this.fetchMessagesByCategory();

    this.socket.chatList.subscribe(chatList => {

      this.chatList = chatList as any;
      this.chatListHeads = chatList.map((x: any) => x[0]);

      if(chatList.length === 0) {
        return;
      }

      if(this.socket.chatmateId === 0 ) {
        this.socket.chatmateId = chatList[0][0].chatmate_id;
        this.socket.loadMoreMessages(chatList[0].length, chatList[0][0].chatmate_id);
      }

      this.chat = chatList[chatList.findIndex(x => x[0].chatmate_id === this.socket.chatmateId)];
    });
  }

  public getStatusAndStamp = (object: any): any => {


    console.log(new Date(object.sent_at).toLocaleString());

    switch(object.content_status) {
      case 'sending':
        return 'sending';
      case 'sent':
        return `${object.content_status} at ${this.getDate(object.sent_at)}`;
      case 'delivered':
        return `${object.content_status} at ${this.getDate(object.delivered_at)}`;
      case 'seen':
        return `${object.content_status} at ${this.getDate(object.seen_at)}`;
      default:
        return 'unknown status';
    }
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

  public selectChat = (chatHead: any) => {

    if(this.socket.chatmateId === chatHead.chatmate_id) {
      return;
    }

    this.newMessage = '';
    this.socket.blankMessage();

    this.socket.chatmateId = chatHead.chatmate_id;
    this.socket.checkIfChatmateIsTyping(chatHead.chatmate_id);

    if(this.newMessage !== '') {
      this.isUserTyping = false;
    }

    const chatIndex = this.chatList.findIndex((x: any) => x[0].chatmate_id === chatHead.chatmate_id);
    if(chatIndex === -1) {
      return;
    }

    this.chat = this.chatList[chatIndex];
    const existingMessageLength = this.chat.length;

    if(existingMessageLength === 1) {
      this.isMessagesLoading = true;
      this.socket.loadMoreMessages(existingMessageLength, chatHead.chatmate_id);
    }

    this.socket.markChatHeadAsSeen(chatHead.chatmate_id);
    this.socket.notifyBackendThatChatIsBeingSeen();
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
      this.fetchMessagesByCategory();
    }
  }


  viewDetails(index: number): void {
    console.log('viewDetails');
    const message = this.messages[index];
    alert(`Message details:\nSender: ${message.sender}\nTime: ${message.time}\nMessage: ${message.message}\nLocation: ${message.ipLocation}`);
  }

  getLatestMessageTime(category: string): any {
    console.log('getLatestMessageTime');
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

