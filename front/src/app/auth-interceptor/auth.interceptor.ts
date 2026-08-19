import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';
import { AuthLogin } from '../common/auth-login/auth-login'

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthLogin);
  const toast = inject(ToastrService);
  const token = localStorage.getItem('access_token');

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) {
        authService.logout();
        toast.warning("Sessão expirada");
        router.navigate(['']);
        return throwError(() => new Error('Auth-401'));
      }
      if (error.status === 403 && token) {
        toast.error("Conta sem permissão de acesso");
        router.navigate(['/dashboard']);
        return throwError(() => new Error('Auth-403'));
      }
      return throwError(() => error);
    })
  );
};