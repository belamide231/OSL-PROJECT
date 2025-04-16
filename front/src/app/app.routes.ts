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
import { InvitationGuard } from './guards/invitation.guard';
import { AuthenticationGuard } from './guards/authentication.guard';
import { AuthorizationGuard } from './guards/authorization.guard';
import { HasKeyGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: '',                     component: DashboardComponent,             canActivate: [AuthenticationGuard, AuthorizationGuard],   data: { RequiredRole: 'admin' }},
    { path: 'chat',                 component: AdminChat,                      canActivate: [AuthenticationGuard, AuthorizationGuard],   data: { RequiredRole: 'admin' }},
    { path: 'users',                component: UsersComponent,                 canActivate: [AuthenticationGuard, AuthorizationGuard],   data: { RequiredRole: 'admin' }},
    { path: 'notifications',        component: NotificationsComponent,         canActivate: [AuthenticationGuard, AuthorizationGuard],   data: { RequiredRole: 'admin' }},
    { path: 'settings',             component: SettingsComponent,              canActivate: [AuthenticationGuard, AuthorizationGuard],   data: { RequiredRole: 'admin' }},
    { path: 'profile',              component: ProfileComponent,               canActivate: [AuthenticationGuard, AuthorizationGuard],   data: { RequiredRole: 'admin' }},
    { path: 'usermanage',           component: UserManageComponent,            canActivate: [AuthenticationGuard, AuthorizationGuard],   data: { RequiredRole: 'admin' }},
    { path: 'user-invite',          component: UserInvitationComponent,        canActivate: [AuthenticationGuard, AuthorizationGuard],   data: { RequiredRole: 'admin' }},
    { path: 'login',                component: LoginComponent,                 canActivate: [HasKeyGuard]},

    { path: 'achat',                component: AccountChat,                    canActivate: [AuthenticationGuard, AuthorizationGuard],   data: { RequiredRole: 'account' }},
    { path: 'adashboard',           component: AgentDashboardComponent,        canActivate: [AuthenticationGuard, AuthorizationGuard],   data: { RequiredRole: 'account' }},
    { path: 'anotifications',       component: AgentNotificationsComponent,    canActivate: [AuthenticationGuard, AuthorizationGuard],   data: { RequiredRole: 'account' }},
    { path: 'asettings',            component: AgentSettingsComponent,         canActivate: [AuthenticationGuard, AuthorizationGuard],   data: { RequiredRole: 'account' }},
    { path: 'acontacts',            component: AgentContactsComponent,         canActivate: [AuthenticationGuard, AuthorizationGuard],   data: { RequiredRole: 'account' }},

    { path: 'signup',               component: SignUpComponent,                canActivate: [HasKeyGuard, InvitationGuard]},
    { path: '**', redirectTo: 'login'}
];