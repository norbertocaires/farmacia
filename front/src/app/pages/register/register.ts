import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { SHARED_IMPORTS } from '../../shared-imports';
import { RegisterService } from './services/register';
import { AuthLogin } from '../../common/auth-login/auth-login';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [...SHARED_IMPORTS], // Adicionado o spread operator (...)
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  registerService = inject(RegisterService);
  authLogin = inject(AuthLogin);
  router = inject(Router);
  private toast = inject(ToastrService);

  ngOnInit() {
    if (this.authLogin.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  // Objeto que o ngModel preenche diretamente
  userData = { name: '', email: '', password: '' };

  onRegister() {
    // Validação simples antes de enviar
    if (this.userData.name && this.userData.email && this.userData.password) {
      
      this.registerService.register(this.userData).subscribe({
        next: (res) => {
          this.toast.success('Cadastro realizado com sucesso!');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Erro ao cadastrar no Postinho');
        }
      });

    } else {
      this.toast.warning('Por favor, preencha todos os campos.');
    }
  }
}