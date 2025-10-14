// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si está autenticado
  if (!authService.isLoggedIn()) {
    router.navigate(['/login-required'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Si la ruta requiere roles específicos, verificarlos
  const requiredRoles = route.data['roles'] as string[] | undefined;
  
  if (requiredRoles && requiredRoles.length > 0) {
    const userRoles = authService.getUserRoles();
    
    // Verificar si el usuario tiene al menos uno de los roles requeridos
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      console.warn('⚠️ Acceso denegado: el usuario no tiene los roles requeridos', {
        required: requiredRoles,
        userHas: userRoles
      });
      
      router.navigate(['/'], {
        queryParams: { error: 'insufficient_permissions' }
      });
      return false;
    }
  }

  return true;
};

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }

  // Si ya está logueado, redirigir al home
  router.navigate(['/']);
  return false;
};

/**
 * Guard específico para verificar rol de advertiser
 */
export const advertiserGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login-required'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  if (!authService.hasAdvertiserRole()) {
    console.warn('⚠️ Acceso denegado: se requiere rol de advertiser');
    router.navigate(['/'], {
      queryParams: { error: 'advertiser_only' }
    });
    return false;
  }

  return true;
};