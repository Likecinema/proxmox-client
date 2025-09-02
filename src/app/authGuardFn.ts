import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ApiService } from '../app/api.service';

export const authGuardFn: CanActivateFn = async (
) => {
  const router = inject(Router);
  const api = inject(ApiService);

  api.isAdmin.set(api.hasAdminRole());
  return Boolean(api.getTicket()) || router.parseUrl('/login');
};
