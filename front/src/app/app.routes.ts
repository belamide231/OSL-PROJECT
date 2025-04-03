import { Routes } from '@angular/router';
import { DashboardComponent } from './admin-pages/dashboard/dashboard.component';
import { LoginComponent } from './admin-pages/login/login.component';
import { ChatComponent as AdminChat } from './admin-pages/chat/chat.component';
import { UsersComponent } from './admin-pages/users/users.component';
import { NotificationsComponent } from './admin-pages/notifications/notifications.component';
import { SettingsComponent } from './admin-pages/settings/settings.component';
import { ProfileComponent } from './admin-pages/profile/profile.component';
import { UserManageComponent } from './admin-pages/user-manage/user-manage.component';
import { UserInvitationComponent } from './admin-pages/user-invitation/user-invitation.component';
import { ChatComponent as AccountChat } from './account-pages/chat/chat.component';
import { AgentDashboardComponent } from './account-pages/agent-dashboard/agent-dashboard.component';
import { AgentNotificationsComponent } from './account-pages/agent-notifications/agent-notifications.component';
import { AgentSettingsComponent } from './account-pages/agent-settings/agent-settings.component';
import { AgentContactsComponent } from './account-pages/agent-contacts/agent-contacts.component';
import { SignUpComponent } from './admin-pages/sign-up/sign-up.component';

export const routes: Routes = [
    { path: '',                     component: DashboardComponent },
    { path: 'chat',                 component: AdminChat },
    { path: 'users',                component: UsersComponent },
    { path: 'notifications',        component: NotificationsComponent },
    { path: 'settings',             component: SettingsComponent },
    { path: 'profile',              component: ProfileComponent },
    { path: 'usermanage',           component: UserManageComponent },
    { path: 'user-invite',          component: UserInvitationComponent },
    { path: 'login',                component: LoginComponent },
    { path: 'achat',                component: AccountChat },
    { path: 'adashboard',           component: AgentDashboardComponent },
    { path: 'anotifications',       component: AgentNotificationsComponent  },
    { path: 'asettings',            component: AgentSettingsComponent},
    { path: 'acontacts',            component: AgentContactsComponent},
    { path: 'sign-up',              component: SignUpComponent },
    { path: '**', redirectTo: '' }
];

