import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./components/navbar/navbar";
import { NavbarLogout } from "./components/navbar-logout/navbar-logout";
import { AuthLogin } from './common/auth-login/auth-login';
import { SyncProgressComponent } from './components/sync-progress/sync-progress.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, NavbarLogout, SyncProgressComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  authLogin = inject(AuthLogin);

  get isLogin(): boolean {
    return this.authLogin.isLoggedIn();
  }

  protected readonly title = signal('farmacia-front');
}