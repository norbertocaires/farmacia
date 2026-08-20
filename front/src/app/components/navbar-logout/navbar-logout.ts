// src/app/components/navbar-logout/navbar-logout.component.ts
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../common/theme/theme.service';

@Component({
  selector: 'app-navbar-logout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive], // Importante para os links
  templateUrl: './navbar-logout.html',
  styleUrl: './navbar-logout.scss'
})
export class NavbarLogout {
  themeService = inject(ThemeService);
}