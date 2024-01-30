import { Routes } from '@angular/router';
import { AuthRootComponent } from './auth-root/auth-root.component';
import { authGuardFn } from './authGuardFn';
import { LoginComponent } from './login/login.component';
import { RequestsComponent } from './requests/requests.component';
import { SignupComponent } from './signup/signup.component';
import { UsersComponent } from './users/users.component';

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
        path: 'users',
        component: UsersComponent
      },
      {
        path: 'requests',
        component: RequestsComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
