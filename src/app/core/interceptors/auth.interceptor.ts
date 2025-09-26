import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const oauthService = inject(OAuthService);

  // Si es una petición a assets, no agregar token
  if (req.url.includes('/assets/') || req.url.includes('silent-refresh')) {
    return next(req);
  }

  // Si el usuario está autenticado, agregar el token
  const token = oauthService.getAccessToken();
  
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  return next(req);
};