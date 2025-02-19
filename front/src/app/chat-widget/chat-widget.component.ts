import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrls: [],
})
export class ChatWidgetComponent implements OnInit {
  isChatOpen = false;
  newMessage = '';
  messagesList: { sender: 'user' | 'bot'; text: string }[] = [];
  textareaHeight: string = 'auto';
  
  

  @ViewChild('messages') messagesContainer!: ElementRef;

  ngOnInit() {
    // Load the external chat widget script dynamically on component initialization
   console.log('Chat Widget loaded');
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) {
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }
  adjustHeight(event: any) {
    const textarea = event.target;
    textarea.style.height = 'auto'; // Reset the height to calculate the new value
    const newHeight = Math.max(textarea.scrollHeight, 64); // Minimum height should be 64px (min-h-16)
    this.textareaHeight = newHeight <= 128 ? `${newHeight}px` : '128px'; // max-h-24 is 96px
  }

  closeChat() {
    this.isChatOpen = false;
  }
  stopEventPropagation(event: MouseEvent) {
    event.stopPropagation();  // Prevent the click from bubbling up to the overlay
  }
  @HostListener('document:keydown', ['$event'])
handleKeyboardEvent(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    this.closeChat();  // Close the modal when 'Esc' is pressed
  }
}

  

  sendMessage() {
    if (this.newMessage.trim()) {
      // Add user's message
      this.messagesList.push({ sender: 'user', text: this.newMessage });

      // Simulate bot's reply
      setTimeout(() => {
        this.messagesList.push({
          sender: 'bot',
          text: 'Thanks for your message! How can I help?',
        });
        this.scrollToBottom();
      }, 1000);

      // Clear input
      this.newMessage = '';
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    }
  }


}
