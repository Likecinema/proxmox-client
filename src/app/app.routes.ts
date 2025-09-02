import { Routes } from '@angular/router';
import { AuthRootComponent } from './auth-root/auth-root.component';
import { authGuardFn } from './authGuardFn';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { RequestsComponent } from './requests/requests.component';
import { SignupComponent } from './signup/signup.component';
import { UsersComponent } from './users/users.component';
import { UserMenuComponent } from './user-menu/user-menu.compoment';
import { JobsComponent } from './jobs/jobs.component';
import { SchedulerComponent } from './scheduler/scheduler.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/login'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path: 'app',
    canActivate: [authGuardFn],
    component: AuthRootComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'users',
        component: UsersComponent,
        children: [
          {
            path: ':id/jobs',
            canActivate: [authGuardFn],
            component: UserMenuComponent,
          },
          {
            path: ':id/requests',
            canActivate: [authGuardFn],
            component: UserMenuComponent
          }
        ]
      },
      {
        path: 'requests',
        component: RequestsComponent
      },
      {
        path: 'jobs',
        component: JobsComponent,
      },
      {
        path: 'schedule',
        component: SchedulerComponent,
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
