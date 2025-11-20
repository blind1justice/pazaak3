import { CanMatchFn, Route, Router, UrlSegment } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service/auth-service';

export const authGuard: CanMatchFn = (_route: Route, _segments: UrlSegment[]) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isUserAuthenticated();

  if (!isAuthenticated) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: location.pathname }
    });
    return false;
  }

  return true;
};
