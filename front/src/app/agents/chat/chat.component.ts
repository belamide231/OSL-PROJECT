import { Component, OnInit } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { aSidebarComponent } from "../sidebar/sidebar.component";
import { ChatWidgetComponent } from "../../chat-widget/chat-widget.component";
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, aSidebarComponent, ChatWidgetComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})

export class ChatComponent implements OnInit {
  messages: { sender: string; message: string; time: string; type: 'sent' | 'received'; priority?: boolean; status?: 'open' | 'pending' | 'closed'; ipLocation: string }[] = [];
  newMessage: string = '';
  selectedCategory: string = 'all';  // Default category
  selectedChat: { sender: string; message: string; time: string;  type: 'sent' | 'received'; priority?: boolean; status?: 'open' | 'pending' | 'closed'; ipLocation: string } | null = null;
  showOptions: boolean = false;
  loading: boolean = false;  // To track loading state
  composeModal: boolean = false;
  attachmentModal: boolean = false;

  constructor(private chatService: ChatService, private readonly api: ApiService, private readonly socket: SocketService) {}

  ngOnInit(): void {
    this.fetchMessagesByCategory();
    // const themeColors = localStorage.getItem('themeColors');
    // if (themeColors) {
    //   const colors = JSON.parse(themeColors);
    //   document.documentElement.style.setProperty('--primary-color', colors.primary);
    //   document.documentElement.style.setProperty('--secondary-color', colors.secondary);
    //   document.documentElement.style.setProperty('--accent-color', colors.accent);
    //   document.documentElement.style.setProperty('--whites-color', colors.whites);
    // }

    this.api.theme().subscribe((res: any) => {
      if(isFinite(res)) 
        return;

      document.documentElement.style.setProperty('--primary-color', res.primary_color);
      document.documentElement.style.setProperty('--secondary-color', res.secondary_color);
      document.documentElement.style.setProperty('--accent-color', res.accent_color);
      document.documentElement.style.setProperty('--whites-color', res.whites_color);
    });
  }

  fetchMessagesByCategory(): void {
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
      }; // Show the first message as selected
    }
    this.loading = false;
  }

  changeCategory(category: string): void {
    this.selectedCategory = category;
    this.fetchMessagesByCategory();
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.chatService.sendMessage(this.newMessage, this.selectedCategory);
      this.fetchMessagesByCategory();
      this.newMessage = '';  // Clear the input field
    }
  }

  editMessage(index: number): void {
    const newMessage = prompt('Edit message:', this.messages[index].message);
    if (newMessage !== null) {
      this.chatService.editMessage(index, newMessage, this.selectedCategory);
      this.fetchMessagesByCategory();
    }
  }



  viewDetails(index: number): void {
    const message = this.messages[index];
    alert(`Message details:\nSender: ${message.sender}\nTime: ${message.time}\nMessage: ${message.message}\nLocation: ${message.ipLocation}`);
  }

  getLatestMessageTime(category: string): string {
    return this.chatService.getLatestTime(category);
  }

  // New function to handle when a user clicks a message
  selectMessage(message: { sender: string; message: string; time: string; type: 'sent' | 'received'; priority?: boolean; status?: 'open' | 'pending' | 'closed'; ipLocation: string }) {
    this.selectedChat = message;
  }
  addNotes(){
    alert('Notes added')
  }
  viewTranscript(){
    alert('Transcript viewed')
  }
  deleteMessage(){
    alert('Message deleted')
  }
 

  toggleOptions(): void {
    this.showOptions = !this.showOptions;
  }
  showComposeModal(){
    this.composeModal = !this.composeModal;
  }
  closeComposeModal(){
    this.composeModal = false;
  }
  sendComposeMessage(){
    alert('Message sent')
  }
  sendAttachment(){
    this.attachmentModal = !this.attachmentModal;
  }
  uploadFiles(){
    alert('Files uploaded')
  }




}

