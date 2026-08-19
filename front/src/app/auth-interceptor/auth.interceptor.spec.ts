import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { authInterceptor } from './auth.interceptor';
import { AuthLogin } from '../common/auth-login/auth-login';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ToastrService, useValue: toast },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should not set an Authorization header when there is no token', () => {
    http.get('/api/ping').subscribe();

    const req = httpMock.expectOne('/api/ping');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should attach the bearer token when one is stored', () => {
    localStorage.setItem('access_token', 'token-123');

    http.get('/api/ping').subscribe();

    const req = httpMock.expectOne('/api/ping');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    req.flush({});
  });

  it('should log the user out and redirect to login on a 401 with a stored token', () => {
    localStorage.setItem('access_token', 'token-123');
    const authLogin = TestBed.inject(AuthLogin);
    const router = TestBed.inject(Router);
    const logoutSpy = vi.spyOn(authLogin, 'logout');
    const navigateSpy = vi.spyOn(router, 'navigate');

    let error: unknown;
    http.get('/api/secure').subscribe({ error: (err) => (error = err) });

    httpMock.expectOne('/api/secure').flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(logoutSpy).toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['']);
    expect((error as Error).message).toBe('Auth-401');
  });

  it('should redirect to the dashboard on a 403 with a stored session', () => {
    localStorage.setItem('access_token', 'token-123');
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    let error: unknown;
    http.get('/api/forbidden').subscribe({ error: (err) => (error = err) });

    httpMock.expectOne('/api/forbidden').flush({}, { status: 403, statusText: 'Forbidden' });

    expect(toast.error).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
    expect((error as Error).message).toBe('Auth-403');
  });

  it('should not redirect on a 403 with no session (e.g. a rejected login attempt)', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    let error: any;
    http.get('/api/forbidden').subscribe({ error: (err) => (error = err) });

    httpMock.expectOne('/api/forbidden').flush({ message: 'Conta bloqueada' }, { status: 403, statusText: 'Forbidden' });

    expect(toast.error).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
    expect(error.status).toBe(403);
  });

  it('should let other errors pass through untouched', () => {
    let error: any;
    http.get('/api/broken').subscribe({ error: (err) => (error = err) });

    httpMock.expectOne('/api/broken').flush({}, { status: 500, statusText: 'Server Error' });

    expect(error.status).toBe(500);
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
  });
});
