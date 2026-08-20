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
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
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
});
