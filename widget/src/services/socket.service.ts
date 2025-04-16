import { Injectable } from '@angular/core';
import { Socket as SocketServer, io } from 'socket.io-client';
import { dns } from '../environment/dns';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  public Connected: boolean = false;
  private Socket: SocketServer | null = null;

  Connect(): void {
    this.Socket = io(dns, { withCredentials: true });
    if(this.Socket) {
      this.Socket.on('connected', () => {
        console.log('You are now connected!');
        this.Connected = true;
      });
    }
  }
}
