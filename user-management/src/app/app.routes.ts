import { Routes } from '@angular/router';
import { UserFormComponent } from './components/user-form/user-form.component';
import { UserSearchComponent } from './components/user-search/user-search.component';
import { UploadComponent } from './components/upload/upload.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const appRoutes: Routes = [
  { 
    path: '', 
    redirectTo: 'login', 
    pathMatch: 'full' 
  },
  {
    path: 'login',
    component: UserFormComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [() => localStorage.getItem('isAuthenticated') === 'true']
  },
  {
    path: 'add',
    component: UserFormComponent,
    canActivate: [() => localStorage.getItem('isAuthenticated') === 'true']
  },
  {
    path: 'find',
    component: UserSearchComponent,
    canActivate: [() => localStorage.getItem('isAuthenticated') === 'true']
  },
  {
    path: 'upload',
    component: UploadComponent,
    canActivate: [() => localStorage.getItem('isAuthenticated') === 'true']
  }
];