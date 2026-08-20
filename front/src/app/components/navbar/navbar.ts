import { Component, computed, ElementRef, HostListener, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthLogin } from '../../common/auth-login/auth-login';
import { ThemeService } from '../../common/theme/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent {
  authLogin = inject(AuthLogin);
  router = inject(Router);
  el = inject(ElementRef);
  themeService = inject(ThemeService);

  menuAberto = false;
  userName = this.authLogin.userName;
  userRole = this.authLogin.userRole;
  userPhoto = this.authLogin.userPhoto;

  userInitials = computed(() => {
    const parts = (this.userName() ?? '').trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  });
  canSeeCatalog = this.authLogin.canSeeCatalog;
  canSeeImport = this.authLogin.canSeeImport;
  canSeeUserAdmin = this.authLogin.canSeeUserAdmin;
  canSeeLogs = this.authLogin.canSeeLogs;

  toggleMenu() {
    this.menuAberto = !this.menuAberto;
  }

  navegarPara(rota: string) {
    this.menuAberto = false;
    this.router.navigate([rota]);
  }

  logout() {
    this.menuAberto = false; // Garante que fecha ao sair
    this.authLogin.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Se o menu estiver aberto e o clique for FORA do componente navbar
    if (this.menuAberto && !this.el.nativeElement.contains(event.target)) {
      this.menuAberto = false;
    }
  }
}