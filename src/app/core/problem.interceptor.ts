import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ToastService } from './toast.service';

/** Set on requests whose screen shows the error itself, such as live previews. */
export const SILENT_ERRORS = new HttpContextToken<boolean>(() => false);

/** RFC 7807 body both APIs send on errors. */
export interface Problem {
  status: number;
  detail?: string;
  errors?: Record<string, string>;
}

/** Turns any API error into a readable toast; the caller still gets the error. */
export const problemInterceptor: HttpInterceptorFn = (request, next) => {
  const toasts = inject(ToastService);
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!request.context.get(SILENT_ERRORS)) {
        toasts.error(describe(error));
      }
      return throwError(() => error);
    }),
  );
};

export function describe(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Não foi possível falar com a API. Ela está rodando?';
  }
  const problem = error.error as Problem | null;
  const fields = problem?.errors ? Object.entries(problem.errors) : [];
  if (fields.length > 0) {
    return fields.map(([field, message]) => `${field}: ${message}`).join(' · ');
  }
  return problem?.detail ?? `Erro ${error.status}`;
}
