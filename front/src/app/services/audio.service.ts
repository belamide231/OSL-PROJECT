import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  
  private message = new Audio('assets/audio/message.MP3');

  public playMessage = () => {
    this.message.muted = false;
    this.message.play();
    this.message.muted = true;
  }  
}
