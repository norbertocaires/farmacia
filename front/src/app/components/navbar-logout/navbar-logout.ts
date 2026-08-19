// src/app/components/navbar-logout/navbar-logout.component.ts
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar-logout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive], // Importante para os links
  templateUrl: './navbar-logout.html',
  styleUrl: './navbar-logout.scss'
})
export class NavbarLogout {
  // Este componente é focado apenas na navegação inicial
}