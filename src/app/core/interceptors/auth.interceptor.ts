import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';
import { CommunityService } from '../services/community.service';
import { environment } from 'src/environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const oauthService = inject(OAuthService);
  const communityService = inject(CommunityService);

  // Si es una petición a assets, no agregar token
  if (req.url.includes('/assets/') || req.url.includes('silent-refresh')) {
    return next(req);
  }

  // Si el usuario está autenticado, agregar el token
  const token = oauthService.getAccessToken();
  
  if (req.url.includes('/api/') && token) {
    const community = communityService.community();
    const communityId = community ? String(community.id) : '0';
    const clonedReq = req.clone({       
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'X-Community-Context': communityId
      }
    });
    return next(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si recibimos un 401, redirigir al login
        if (error.status === 401) {
          console.error('Token expirado o inválido, redirigiendo al login');
          oauthService.initLoginFlow();
          return throwError(() => new Error('Unauthorized - redirecting to login'));
        }
        return throwError(() => error);
      })
    );
  }

  return next(req);
};