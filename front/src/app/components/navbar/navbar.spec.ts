import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { NavbarComponent } from './navbar';
import { AuthLogin } from '../../common/auth-login/auth-login';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      // Rota coringa: alguns testes clicam num <a routerLink>, que dispara navegação
      // de verdade — sem isso o router loga "no match" pra qualquer destino.
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: '**', component: NavbarComponent }])],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build user initials from the first and last name', () => {
    const authLogin = TestBed.inject(AuthLogin);
    (authLogin as any).userSignal.set({ id: 1, name: 'Maria Silva', email: 'maria@teste.com', role: 'admin' });
    fixture.detectChanges();

    expect(component.userInitials()).toBe('MS');
  });

  it('should toggle the settings dropdown menu', () => {
    expect(component.menuAberto).toBe(false);
    component.toggleMenu();
    expect(component.menuAberto).toBe(true);
    component.toggleMenu();
    expect(component.menuAberto).toBe(false);
  });

  it('should toggle the mobile hamburger nav menu', () => {
    expect(component.navMenuAberto).toBe(false);
    component.toggleNavMenu();
    expect(component.navMenuAberto).toBe(true);
    component.toggleNavMenu();
    expect(component.navMenuAberto).toBe(false);
  });

  it('should close the mobile nav menu when a nav link inside it is clicked', () => {
    fixture.detectChanges();
    const hamburgerBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.hamburger-btn');
    hamburgerBtn.click();
    fixture.detectChanges();
    expect(component.navMenuAberto).toBe(true);

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('nav.menu a');
    link.click();
    fixture.detectChanges();

    expect(component.navMenuAberto).toBe(false);
  });

  it('should render a hamburger button that opens the mobile nav panel', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.hamburger-btn');
    expect(button).toBeTruthy();

    button.click();
    fixture.detectChanges();

    expect(component.navMenuAberto).toBe(true);
    expect(fixture.nativeElement.querySelector('nav.menu.open')).toBeTruthy();
  });
});
