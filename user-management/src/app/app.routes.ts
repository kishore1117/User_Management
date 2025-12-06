import { Routes } from '@angular/router';
import { UserFormComponent } from './components/user-form/user-form.component';
import { UserSearchComponent } from './components/user-search/user-search.component';
import { UploadComponent } from './components/upload/upload.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserDetailsComponent } from './components/user-details/user-details.component';
import { AdminComponent } from './components/admin/admin.component';

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
    path: "users",
    component: UserListComponent,
    canActivate: [() => localStorage.getItem('isAuthenticated') === 'true']
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
  },
  {
    path: 'user/:id',
    component: UserDetailsComponent,
    canActivate: [() => localStorage.getItem('isAuthenticated') === 'true']
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