import { Injectable } from '@angular/core';
import { ChatService } from './services.component/chat.service';
import { UserService } from './services.component/user.service';
import { ThemeService } from './services.component/theme.service';
import { SidebarService } from './services.component/sidebar.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(
    public readonly chat: ChatService,
    public readonly user: UserService,
    public readonly theme: ThemeService,
    public readonly sidebar: SidebarService
  ) {};
}
