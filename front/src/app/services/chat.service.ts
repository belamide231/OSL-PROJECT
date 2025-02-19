import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private messages: { [key: string]: { sender: string; message: string; time: string; type: 'sent' | 'received'; ipLocation: string; status: 'open' | 'closed' | 'pending'; priority: boolean }[] } = {
    all: [
      { sender: 'Mary Franci', message: 'Can I try the software first?', time: '10:00', type: 'received', ipLocation: '192.168.0.1', status: 'open', priority: false },
      { sender: 'You', message: 'Sure. Here is the demo unit. You can use it as long as you want.', time: '10:02', type: 'sent', ipLocation: '192.168.0.2', status: 'open', priority: false },
      { sender: 'Carlos Dakkis', message: 'It works for me. Thanks!', time: '11:30', type: 'received', ipLocation: '192.168.0.3', status: 'pending', priority: false },
      { sender: 'Maria Vetovs', message: 'Let’s stay in touch. Thank you!', time: '12:15', type: 'received', ipLocation: '192.168.0.4', status: 'open', priority: false },
      { sender: 'Omar Vetovs', message: 'Voice message received. Let me check.', time: '13:00', type: 'received', ipLocation: '192.168.0.5', status: 'closed', priority: true },
      { sender: 'Marcus Bergson', message: 'I need help with my account setup.', time: '14:20', type: 'received', ipLocation: '192.168.0.6', status: 'open', priority: false },
    ],
    assigned: [
      { sender: 'Aspen Workman', message: 'Hello! I am looking for a new product recommendation.', time: '09:00', type: 'received', ipLocation: '192.168.1.1', status: 'open', priority: false },
      { sender: 'You', message: 'Sure, let me show you some options.', time: '09:10', type: 'sent', ipLocation: '192.168.1.2', status: 'pending', priority: false },
      { sender: 'Rhiel Madsen', message: 'Typing... I will send the details shortly.', time: '10:00', type: 'received', ipLocation: '192.168.1.3', status: 'open', priority: false },
      { sender: 'Carlos Dakkis', message: 'I need help with billing. Can you assist?', time: '11:30', type: 'received', ipLocation: '192.168.1.4', status: 'closed', priority: true },
    ],
  };

  constructor() {}

  // Get messages by category (type)
  getMessagesByType(type: string): { sender: string; message: string; time: string; type: 'sent' | 'received'; ipLocation: string; status: 'open' | 'closed' | 'pending'; priority: boolean }[] {
    return this.messages[type] || [];
  }

  // Send a message (simulating with fake IP)
  sendMessage(newMessage: string, category: string = 'all'): void {
    if (newMessage.trim()) {
      const fakeIp = '192.168.99.99'; // Hardcoded fake IP address for sending
      const message = {
        sender: 'You',
        message: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'sent' as 'sent', // Explicitly setting the type as 'sent'
        ipLocation: fakeIp, // Hardcoded fake IP location
        status: 'open' as 'open', // Default status when a message is sent
        priority: false, // Default priority to false
      };

      // Push the new message to the specified category
      if (this.messages[category]) {
        this.messages[category].push(message);
      } else {
        console.error('Invalid category provided');
      }
    }
  }

  // Edit a message
  editMessage(index: number, newMessage: string, category: string): void {
    if (this.messages[category] && this.messages[category][index]) {
      this.messages[category][index].message = newMessage;
    }
  }

  // Delete a message
  deleteMessage(index: number, category: string): void {
    if (this.messages[category] && this.messages[category][index]) {
      this.messages[category].splice(index, 1);
    }
  }

  // Method to set the chat status (open, closed, pending)
  setChatStatus(index: number, category: string, status: 'open' | 'closed' | 'pending'): void {
    if (this.messages[category] && this.messages[category][index]) {
      this.messages[category][index].status = status;
    }
  }

  // Method to toggle chat priority
  togglePriority(index: number, category: string): void {
    if (this.messages[category] && this.messages[category][index]) {
      this.messages[category][index].priority = !this.messages[category][index].priority;
    }
  }

  // Helper method to get the latest message of a chat (to show in inbox)
  getLatestMessage(category: string): string {
    const messages = this.messages[category];
    if (messages && messages.length > 0) {
      return messages[messages.length - 1].message;
    }
    return '';
  }

  // Helper method to get the latest message time (to show in inbox)
  getLatestTime(category: string): string {
    const messages = this.messages[category];
    if (messages && messages.length > 0) {
      return messages[messages.length - 1].time;
    }
    return '';
  }

  // Method to get the count of unread messages (if needed for badges or UI indicators)
  getUnreadCount(category: string): number {
    const messages = this.messages[category];
    return messages.filter(msg => msg.type === 'received').length;
  }
}
