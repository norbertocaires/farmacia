import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { App } from './app';
import { AuthLogin } from './common/auth-login/auth-login';
import { SyncService } from './common/socket-io/services/sync.service';

class FakeSyncService {
  getProgress() { return of(null); }
  getMsg() { return of(null); }
  reset() {}
}

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SyncService, useClass: FakeSyncService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should show the logged-out navbar when there is no session', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-navbar-logout')).toBeTruthy();
    expect(compiled.querySelector('app-navbar')).toBeFalsy();
  });

  it('should show the logged-in navbar when a session exists', async () => {
    const fixture = TestBed.createComponent(App);
    const authLogin = TestBed.inject(AuthLogin);
    (authLogin as any).userSignal.set({ id: 1, name: 'Maria', email: 'maria@teste.com', role: 'USUARIO' });
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-navbar')).toBeTruthy();
  });
});
