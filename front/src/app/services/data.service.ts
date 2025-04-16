import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  Chat = {
    ActiveUserOfThisCompany: [] as any[],
    ChatList: [] as any,
    ChatListHeads: [] as any,
    ChatmateIsTyping: [] as any,
    CurrentChatmate: null as null | number,
    CurrentChat: [] as any,
    CurrentInputtedMessage: '' as string,
    CurrentAttachedFile: null as null | any
  }
  UserManage = {
    ListOfAgent: [] as any
  }
}
