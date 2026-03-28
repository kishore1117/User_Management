import { Routes } from '@angular/router';
import { UserFormComponent } from './components/user-form/user-form.component';
import { UserSearchComponent } from './components/user-search/user-search.component';
import { UploadComponent } from './components/upload/upload.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserDetailsComponent } from './components/user-details/user-details.component';
import { AdminComponent } from './components/admin/admin.component';
import { AppComponent } from './app.component';
import { ResetpageComponent } from './components/resetpage/resetpage.component';
import { authGuard } from './services/auth.guard';
import { ForgetPasswordComponent } from './components/forget-password/forget-password.component';

export const appRoutes: Routes = [
  // {
  //   path: '',
  //   redirectTo: 'login',
  //   pathMatch: 'full',
  //   // component: AppComponent
  // },
  // {
  //   path: 'login',
  //   component: UserFormComponent
  // },
  {
    path: "users",
    component: UserListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'add',
    component: UserFormComponent,
    canActivate: [authGuard]
  },
  {
    path: 'find',
    component: UserSearchComponent,
    canActivate: [authGuard]
  },
  {
    path: 'upload',
    component: UploadComponent,
    canActivate: [authGuard]
  },
  {
    path: 'user/:id',
    component: UserDetailsComponent,
    canActivate: [authGuard]
  },
  {
    path:'reset-password',
    component:ResetpageComponent,

  },
  {
    path:'forgot-password',
    component:ForgetPasswordComponent,
  },
  {
    path:'admin',
    component:AdminComponent,
    canActivate: [() => {
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      const userRole = localStorage.getItem('userRole') || '';
      const isAdmin = userRole.toLowerCase().includes('admin');
      return isAuthenticated && isAdmin;
    }]
  }
];