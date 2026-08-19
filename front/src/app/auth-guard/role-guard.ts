import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthLogin } from '../common/auth-login/auth-login';

/**
 * Cria um guard que só libera a rota se `check` retornar true para o usuário logado.
 * Complementa o authGuard (que só verifica se há sessão) com controle por papel,
 * já que as permissões de menu (canSeeUserAdmin, canSeeLogs, ...) até então só
 * escondiam o link na navbar, sem impedir acesso direto pela URL.
 */
export function roleGuard(check: (authLogin: AuthLogin) => boolean): CanActivateFn {
  return () => {
    const router = inject(Router);
    const authLogin = inject(AuthLogin);
    const toast = inject(ToastrService);

    if (check(authLogin)) {
      return true;
    }

    toast.error('Você não tem permissão para acessar esta página.');
    router.navigate(['/dashboard']);
    return false;
  };
}
