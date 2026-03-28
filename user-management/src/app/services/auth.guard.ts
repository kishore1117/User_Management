import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  // ✅ allow reset-password without login
  if (state.url.includes('reset-password') || state.url.includes('forgot-password')) {
    return true;
  }

  if (!isAuthenticated) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};