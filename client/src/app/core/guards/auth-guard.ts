import { CanMatchFn, Route, Router, UrlSegment } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service/auth-service';
import { catchError, of, switchMap, take } from 'rxjs';

export const authGuard: CanMatchFn = (_route: Route, _segments: UrlSegment[]) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.validateSession().pipe(
    take(1),
    switchMap(isValid => {
      if (isValid) {
        return of(true);
      }

      const returnUrl = location.pathname + location.search;
      router.navigate(['/login'], {
        queryParams: {returnUrl: returnUrl || undefined}
      });
      return of(false);
    }),
    catchError(err => {
      console.error('[AuthGuard] Unexpected error:', err);
      router.navigate(['/login']);
      return of(false);
    })
  );
};
