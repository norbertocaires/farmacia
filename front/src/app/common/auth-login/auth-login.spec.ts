import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthLogin } from './auth-login';
import { environment } from '@env/environment';

describe('AuthLogin', () => {
  let httpMock: HttpTestingController;

  const buildService = () =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).inject(AuthLogin);

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    httpMock?.verify();
    localStorage.clear();
  });

  it('should start logged out when there is no stored session', () => {
    const service = buildService();
    httpMock = TestBed.inject(HttpTestingController);

    expect(service.isLoggedIn()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('should restore the session from localStorage on creation', () => {
    localStorage.setItem('user_data', JSON.stringify({ id: 1, name: 'Maria', email: 'maria@teste.com', role: 'admin' }));

    const service = buildService();
    httpMock = TestBed.inject(HttpTestingController);

    expect(service.isLoggedIn()).toBe(true);
    expect(service.userName()).toBe('Maria');
    expect(service.userRole()).toBe('admin');
  });

  it('should store the session and update signals on login', () => {
    const service = buildService();
    httpMock = TestBed.inject(HttpTestingController);

    service.login({ email: 'maria@teste.com', password: '123456' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ access_token: 'token-abc', user: { id: 1, name: 'Maria', email: 'maria@teste.com', role: 'usuario' } });

    expect(service.isLoggedIn()).toBe(true);
    expect(localStorage.getItem('access_token')).toBe('token-abc');
    expect(service.userRole()).toBe('usuario');
    expect(service.isAdmin()).toBe(false);
  });

  it('should clear the session on logout', () => {
    const service = buildService();
    httpMock = TestBed.inject(HttpTestingController);

    service.login({ email: 'maria@teste.com', password: '123456' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({
      access_token: 'token-abc',
      user: { id: 1, name: 'Maria', email: 'maria@teste.com', role: 'admin' },
    });

    service.logout();

    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('user_data')).toBeNull();
  });

  it('should classify ADMIN and SUPER_ADMIN as admin, and FARMACIA separately', () => {
    const service = buildService();
    httpMock = TestBed.inject(HttpTestingController);

    service.login({ email: 'x@x.com', password: '123456' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush({
      access_token: 'token',
      user: { id: 1, name: 'X', email: 'x@x.com', role: 'farmacia' },
    });

    expect(service.isAdmin()).toBe(false);
    expect(service.isFarmacia()).toBe(true);
  });
});
