import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';

type ApiEnvelope = {
  status?: {
    code?: string | null;
  } | null;
};

function isForbiddenPayload(payload: unknown): boolean {
  let normalizedPayload = payload;

  if (typeof payload === 'string') {
    try {
      normalizedPayload = JSON.parse(payload);
    } catch {
      return false;
    }
  }

  if (!normalizedPayload || typeof normalizedPayload !== 'object') {
    return false;
  }

  const envelope = normalizedPayload as ApiEnvelope;
  return (envelope.status?.code || '').toLowerCase() === 'forbidden';
}

function hasForbiddenError(error: HttpErrorResponse): boolean {
  if (error.status === 403) {
    return true;
  }

  return isForbiddenPayload(error.error);
}

export const forbiddenInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  const redirectForbidden = () => {
    if (router.url !== '/forbidden') {
      router.navigateByUrl('/forbidden');
    }
  };

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && isForbiddenPayload(event.body)) {
        redirectForbidden();
      }
    }),
    catchError((error) => {
      if (error instanceof HttpErrorResponse && hasForbiddenError(error)) {
        redirectForbidden();
      }

      return throwError(() => error);
    }),
  );
};
