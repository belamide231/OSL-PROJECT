import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { ConversationComponent } from './components/conversations/conversations.component';
import { UsersComponent } from './components/users/users.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ProfileComponent } from './components/profile/profile.component';
import { UserManageComponent } from './components/user-manage/user-manage.component';
import { UserInvitationComponent } from './components/user-invitation/user-invitation.component';
import { ChatComponent } from './agents/chat/chat.component';
import { AgentDashboardComponent } from './agents/agent-dashboard/agent-dashboard.component';
import { AgentNotificationsComponent } from './agents/agent-notifications/agent-notifications.component';
import { AgentSettingsComponent } from './agents/agent-settings/agent-settings.component';
import { AgentContactsComponent } from './agents/agent-contacts/agent-contacts.component';

export const routes: Routes = [
    { path: '',                     component: DashboardComponent },
    { path: 'chat',                 component: ConversationComponent },
    { path: 'users',                component: UsersComponent },
    { path: 'notifications',        component: NotificationsComponent },
    { path: 'settings',             component: SettingsComponent },
    { path: 'profile',              component: ProfileComponent },
    { path: 'usermanage',           component: UserManageComponent },
    { path: 'user-invite',          component: UserInvitationComponent },
    { path: 'login',                component: LoginComponent },
    { path: 'achat',                component: ChatComponent },
    { path: 'adashboard',           component: AgentDashboardComponent },
    { path: 'anotifications',       component: AgentNotificationsComponent  },
    { path: 'asettings',            component: AgentSettingsComponent},
    { path: 'acontacts',            component: AgentContactsComponent},
    { path: '**', redirectTo: '' }
];
