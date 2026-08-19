import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthLogin } from '../common/auth-login/auth-login';
import { ToastrService } from 'ngx-toastr';


export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authLogin = inject(AuthLogin);
  const toast = inject(ToastrService);

  if (authLogin.isLoggedIn()) {
    return true;
  } else {
    toast.warning('Acesso negado: refaça o login.');
    router.navigate(['/login']);
    return false;
  }
};