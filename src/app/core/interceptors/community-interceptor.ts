import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CommunityService } from '../services/community.service';

export const communityInterceptor: HttpInterceptorFn = (req, next) => {
  const cs = inject(CommunityService);
  let modified = req;

  try {
    const id = cs.getIdOrThrow();
    modified = req.clone({
      setHeaders: { 'X-Community-Id': id }, 
    });
  } catch {}

  return next(modified);
};
