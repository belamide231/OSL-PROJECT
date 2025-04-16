import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, firstValueFrom, map, Observable, of } from 'rxjs';
import { dns } from '../../environment/dns';
import { loginAccountDto } from '../dto/account/loginAccountDto';
import { AccessService } from './access.service';
import { DataService } from './data.service';
import queryString from 'query-string';

function domain(path: string): string {
  return dns.slice(0, -1) + path;
}
const headers = { headers: { 'Content-Type': 'application/json' }, withCredentials: true, observe: 'response' as 'response', responseType: 'text' as 'json' };
const jsonheaders = { headers: { 'Content-Type': 'application/json' }, withCredentials: true, observe: 'response' as 'response', responseType: 'json' as 'json' };

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(
    private readonly Http: HttpClient, 
    private readonly Access: AccessService,
    public Data: DataService) {}

  Initialization(): void {
    this.companyLoadTheme();
    this.companyLoadActiveUser();
  }

  userLogin(username: string, password: string): Observable<any> {
    return this.Http.post(domain('/account/login'), { username, password } as loginAccountDto, headers).pipe(
      map((response) => response),
      catchError((error) => of(error)));
  }
  userLogout(): Observable<any> {
    return this.Http.post(domain('/account/logout'), null, headers).pipe(
      map((response) =>  response),
      catchError((error) => of(error)));
  }
  userInvite(gmail: string): Observable<any> {
    return this.Http.post(domain('/account/invite'), { Gmail: gmail }, headers).pipe(
      map((response) => response.status), 
      catchError((error) => of(error.status)));
  }
  userRegistration(username: string, password: string, verifyPassword: string): Observable<any> {
    return this.Http.post(domain('/account/create'), { 
      username, 
      password, 
      verifyPassword, 
      invitation: queryString.parse(window.location.search)['invitation']
    }, headers).pipe(
      map((response) => response.status), 
      catchError((error) => of(JSON.parse(error.error))));
  }
  async userAccountList(): Promise<void> {
    try {
      const response = this.Http.post(domain('/get/accounts'), null, jsonheaders).pipe(map(response => response)) as any;
      this.Data.UserManage.ListOfAgent = response.body;
    } catch(error) {
      console.log(error);
    }
  }
  private async companyLoadActiveUser(): Promise<void> {
    try {
      const response = await firstValueFrom(this.Http.post(domain('/get/active/scoped/users'), null, jsonheaders).pipe((response: any) => response)) as any;
      console.log(response.body);
      this.Data.Chat.ActiveUserOfThisCompany = response.body;
    } catch(error) {
      console.log(error);
    }
  }
  private async companyLoadTheme(): Promise<void> {
    this.Http.post(domain('/getCompanyTheme'), null, headers)
      .pipe(map((response: any) => JSON.parse(response.body)), 
      catchError((error) => {
        return of(false);
      })
    ).subscribe(response => {
      if(typeof response === 'boolean' && response === false) {
        return alert('Error connection');
      }
      this.Access.SetTheme(response);
    });
  }

  // loadActiveClients = ():Observable<any> => this.Http.post(this.dns('getActiveClients'), null, this.headers).pipe(map((response: any) => JSON.parse(response.body)), catchError((error) => of(error.status)));
  
  // loadChatList = (chatListLength: number): Observable<{ chatList: any[], order: any[] } | number> => {
  //   return this.Http.post(this.dns('loadChatList'), { chatListLength } as loadChatListDto, this.headers).pipe(
      
  //     map((response: any) => {
  //       return JSON.parse(response.body);
  //     }), 
  //     catchError((error) => {
  //       return of(error.status);
  //     }))
  // }
  
  // sendMessage = (receiverId: number, content: string, uuid: string): Observable<any> => this.Http.post(this.dns('sendMessage'), { receiverId, content, uuid } as sendMessageDto, this.headers).pipe(map((response: any) => JSON.parse(response.body)), catchError((error: any) => of(error.status)));
  
  // loadMessage = (messageId: number, chatmateId: number): Observable<any> => this.Http.post(this.dns('loadMessage'), { messageId, chatmateId } as getMessageDto, this.headers).pipe(map((response: any) => JSON.parse(response.body)), catchError((error) => of(error.status)));
  
  // loadMoreMessages = (lengthOfExistingMessages: number, chatmateId: number): Observable<any> => {

  //   const endpoint = this.dns('loadMoreMessages');
  //   const body = { lengthOfExistingMessages, chatmateId };

  //   return this.Http.post(endpoint, body, this.headers).pipe(map((response: any) => {
  //     return JSON.parse(response.body);
  //   }, catchError((error) => {
  //     return of(error.status);
  //   })));
  // }
}
