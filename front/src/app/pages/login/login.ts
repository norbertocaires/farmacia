import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_IMPORTS } from '../../shared-imports';
import { AuthLogin } from '../../common/auth-login/auth-login';
import { ToastrService } from 'ngx-toastr';
import { SocialAuthService, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [SHARED_IMPORTS, GoogleSigninButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {
  authLogin = inject(AuthLogin);
  private router = inject(Router);
  private toast = inject(ToastrService);
  private socialAuth = inject(SocialAuthService);

  loginData = {
    email: '',
    password: ''
  };

  ngOnInit() {
    if (this.authLogin.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }

    this.socialAuth.authState.subscribe(user => {
      if (user?.idToken) {
        this.authLogin.googleLogin(user.idToken).subscribe({
          next: () => {
            this.authLogin.setPhotoUrl(user.photoUrl ?? null);
            this.router.navigate(['/dashboard']);
          },
          error: (err) => this.toast.error(err.error?.message || 'Falha no login com Google.')
        });
      }
    });
  }

  onLogin() {
    if (this.loginData.email && this.loginData.password) {
      this.authLogin.login(this.loginData).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.toast.warning(err.error?.message || 'E-mail ou senha incorretos.');
        }
      });
    }
  }
}
