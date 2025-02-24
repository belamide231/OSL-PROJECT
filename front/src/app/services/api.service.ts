import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { loginAccountDto } from '../dto/account/loginAccountDto';
import { catchError, map, Observable, of } from 'rxjs';
import { dns } from '../../environment/dns';
import { loadChatListDto } from '../dto/messages/loadChatListDto';
import { sendMessageDto } from '../dto/messages/sendMessageDto';
import { getMessageDto } from '../dto/messages/getMessageDto';
import { loadConversationDto } from '../dto/messages/loadMessagesDto';


@Injectable({
  providedIn: 'root',
})
export class ApiService {

  private headers = { headers: { 'Content-Type': 'application/json' }, withCredentials: true, observe: 'response' as 'response', responseType: 'text' as 'json' };
  private dns = (endpoint: string) => dns + endpoint;
  
  constructor(private http: HttpClient) {}

  // ACCOUNT
  login = (username: string, password: string): Observable<string | void> => this.http.post(this.dns('loginAccount'), { username, password } as loginAccountDto, this.headers).pipe(map(() => null), catchError((error) => of(({ 401: 'Incorrect password', 404: 'Username did not exists', 422: 'All fields must be filled', 500: 'Something went wrong to the internal server' } as any)[error.status])));
  logout = (): Observable<string | null> => this.http.post(this.dns('logoutAccount'), null, this.headers).pipe(map(() =>  null),catchError(() => of('Connection error')));
  
  // MESSAGE
  loadActiveClients = ():Observable<any> => this.http.post(this.dns('getActiveClients'), null, this.headers).pipe(map((response: any) => JSON.parse(response.body)), catchError((error) => of(error.status)));
  
  loadChatList = (chatListLength: number): Observable<object[] | number> => this.http.post(this.dns('loadChatList'), { chatListLength } as loadChatListDto, this.headers).pipe(map((response: any) => JSON.parse(response.body)), catchError((error) => of(error.status)));
  
  sendMessage = (receiverId: number, content: string, uuid: string): Observable<any> => this.http.post(this.dns('sendMessage'), { receiverId, content, uuid } as sendMessageDto, this.headers).pipe(map((response: any) => JSON.parse(response.body)), catchError((error: any) => of(error.status)));
  
  loadMessage = (messageId: number, chatmateId: number): Observable<any> => this.http.post(this.dns('loadMessage'), { messageId, chatmateId } as getMessageDto, this.headers).pipe(map((response: any) => JSON.parse(response.body)), catchError((error) => of(error.status)));
  
  loadMessages = (messageLength: number, chatmateId: number): Observable<any> => this.http.post(this.dns('loadMessages'), { chatmateId, messageLength } as loadConversationDto, this.headers).pipe(map((response: any) => JSON.parse(response.body), catchError((error) => of(error.status))));

  // COMPANY 
  theme = (): Observable<object | number> => this.http.post(this.dns('getCompanyTheme'), null, this.headers).pipe(map((response: any) => JSON.parse(response.body)), catchError((error) => of(error.status)));
}
