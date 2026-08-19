import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SocialAuthService } from '@abacritt/angularx-social-login';
import { of, Subject } from 'rxjs';

import { LoginComponent } from './login';
import { environment } from '@env/environment';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let httpMock: HttpTestingController;
  let authState: Subject<any>;
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    localStorage.clear();
    toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };
    authState = new Subject();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ToastrService, useValue: toast },
        { provide: SocialAuthService, useValue: { authState: authState.asObservable(), initState: of(true) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to dashboard on successful login', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.loginData = { email: 'maria@teste.com', password: '123456' };
    component.onLogin();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ access_token: 'token-123', user: { id: 1, name: 'Maria', email: 'maria@teste.com', role: 'USUARIO' } });

    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should warn when login fails', () => {
    component.loginData = { email: 'maria@teste.com', password: 'errada' };
    component.onLogin();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ message: 'E-mail ou senha incorretos.' }, { status: 401, statusText: 'Unauthorized' });

    expect(toast.warning).toHaveBeenCalledWith('E-mail ou senha incorretos.');
  });

  it('should not call the API when fields are empty', () => {
    component.loginData = { email: '', password: '' };
    component.onLogin();

    httpMock.expectNone(`${environment.apiUrl}/auth/login`);
  });
});
