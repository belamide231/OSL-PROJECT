import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DataService { 
  Modals = {
    CloseModalTriggered: false as boolean
  }

  Page: string | null = null;
  Company: string | null = null;
  Chat = {
    CurrentAttachedFile: null as any | null,
    CurrentInputtedMessage: ''
  }
}
