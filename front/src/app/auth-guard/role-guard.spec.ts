import { TestBed } from '@angular/core/testing';
import { CanActivateFn, provideRouter, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { roleGuard } from './role-guard';
import { AuthLogin } from '../common/auth-login/auth-login';

describe('roleGuard', () => {
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };
  let authLoginStub: { canSeeUserAdmin: ReturnType<typeof vi.fn> };

  const run = (guard: CanActivateFn) =>
    TestBed.runInInjectionContext(() => guard({} as any, {} as any));

  beforeEach(() => {
    toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };
    authLoginStub = { canSeeUserAdmin: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ToastrService, useValue: toast },
        { provide: AuthLogin, useValue: authLoginStub },
      ],
    });
  });

  it('should allow activation when the check passes', () => {
    authLoginStub.canSeeUserAdmin.mockReturnValue(true);
    const guard = roleGuard(auth => (auth as any).canSeeUserAdmin());

    expect(run(guard)).toBe(true);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should block activation and redirect to the dashboard when the check fails', () => {
    authLoginStub.canSeeUserAdmin.mockReturnValue(false);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    const guard = roleGuard(auth => (auth as any).canSeeUserAdmin());

    expect(run(guard)).toBe(false);
    expect(toast.error).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });
});
