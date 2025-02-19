import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { dns } from '../environment/dns';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() { 
    this.socket = io(dns, { withCredentials: true });

    this.socket.on('connected', () => {
      console.log("YOU ARE NOW CONNECTED");
    })
  }
}
