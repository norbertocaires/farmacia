import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';

import { Profile } from './profile';
import { ProfileService } from './services/profile';
import { AuthLogin } from '../../common/auth-login/auth-login';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let profileService: { updateProfile: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('user_data', JSON.stringify({ id: 1, name: 'Maria', email: 'maria@teste.com', role: 'usuario' }));

    profileService = { updateProfile: vi.fn(() => of({ access_token: 'novo-token' })) };
    toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProfileService, useValue: profileService },
        { provide: ToastrService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create and prefill the form with the current user', () => {
    expect(component).toBeTruthy();
    expect(component.profileForm.get('email')?.value).toBe('maria@teste.com');
    expect(component.profileForm.get('name')?.value).toBe('Maria');
  });

  it('should update the profile, refresh the session and reset the password field', () => {
    const authLogin = TestBed.inject(AuthLogin);
    const updateSpy = vi.spyOn(authLogin, 'updateUserData');

    component.profileForm.patchValue({ name: 'Maria Silva', password: 'novaSenha' });
    component.save();

    expect(profileService.updateProfile).toHaveBeenCalledWith('maria@teste.com', {
      email: 'maria@teste.com',
      name: 'Maria Silva',
      password: 'novaSenha',
    });
    expect(updateSpy).toHaveBeenCalledWith({ access_token: 'novo-token', user: { name: 'Maria Silva' } });
    expect(toast.success).toHaveBeenCalled();
    expect(component.profileForm.get('password')?.value).toBeNull();
  });

  it('should not submit when the name is invalid', () => {
    component.profileForm.patchValue({ name: 'ab' });
    component.save();

    expect(profileService.updateProfile).not.toHaveBeenCalled();
  });

  it('should keep email and role in session after updating the profile', () => {
    const authLogin = TestBed.inject(AuthLogin);

    component.profileForm.patchValue({ name: 'Maria Silva' });
    component.save();

    expect(authLogin.currentUser()).toEqual({
      id: 1,
      name: 'Maria Silva',
      email: 'maria@teste.com',
      role: 'usuario',
    });
  });
});
