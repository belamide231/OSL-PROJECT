import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { aSidebarComponent } from '../sidebar/sidebar.component';
import { ChatWidgetComponent } from "../../chat-widget/chat-widget.component";
import { DataService } from '../../services/data.service';
import { ActiveUsersComponent } from '../../components/active-users/active-users.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, aSidebarComponent, ChatWidgetComponent, ActiveUsersComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})

export class ChatComponent implements OnInit {
  messages: { sender: string; message: string; time: string; type: 'sent' | 'received'; priority?: boolean; status?: 'open' | 'pending' | 'closed'; ipLocation: string }[] = [];
  newMessage: string = '';
  selectedCategory: string = 'all';
  selectedChat: { sender: string; message: string; time: string;  type: 'sent' | 'received'; priority?: boolean; status?: 'open' | 'pending' | 'closed'; ipLocation: string } | null = null;
  showOptions: boolean = false;
  loading: boolean = false;
  composeModal: boolean = false;
  attachmentModal: boolean = false;

  constructor(public readonly data: DataService) {}

  ngOnInit(): void {

  }

  fetchMessagesByCategory(): void {
  }

  changeCategory(category: string): void {

  }

  sendMessage(): void {
  }

  editMessage(index: number): void {
  }



  viewDetails(index: number): void {
  }

  selectMessage(message: { sender: string; message: string; time: string; type: 'sent' | 'received'; priority?: boolean; status?: 'open' | 'pending' | 'closed'; ipLocation: string }) {
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

