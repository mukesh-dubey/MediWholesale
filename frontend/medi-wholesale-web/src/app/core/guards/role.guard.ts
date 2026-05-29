import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isStaff()) return true;
  if (auth.isCustomer()) return router.createUrlTree(['/portal']);
  return router.createUrlTree(['/login']);
};

export const customerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isCustomer()) return true;
  if (auth.isStaff()) return router.createUrlTree(['/staff']);
  return router.createUrlTree(['/login']);
};
