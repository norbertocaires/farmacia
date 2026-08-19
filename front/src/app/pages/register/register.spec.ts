import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { RegisterComponent } from './register';
import { environment } from '@env/environment';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let httpMock: HttpTestingController;
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    localStorage.clear();
    toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ToastrService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
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

  it('should warn and not call the API when fields are missing', () => {
    component.userData = { name: '', email: '', password: '' };
    component.onRegister();

    expect(toast.warning).toHaveBeenCalled();
    httpMock.expectNone(`${environment.apiUrl}/users/register`);
  });

  it('should register and redirect to login on success', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    component.userData = { name: 'Maria', email: 'maria@teste.com', password: '123456' };
    component.onRegister();

    const req = httpMock.expectOne(`${environment.apiUrl}/users/register`);
    expect(req.request.method).toBe('POST');
    req.flush({ ok: true });

    expect(toast.success).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should show an error toast when registration fails', () => {
    component.userData = { name: 'Maria', email: 'maria@teste.com', password: '123456' };
    component.onRegister();

    const req = httpMock.expectOne(`${environment.apiUrl}/users/register`);
    req.flush({ message: 'E-mail já cadastrado' }, { status: 409, statusText: 'Conflict' });

    expect(toast.error).toHaveBeenCalledWith('E-mail já cadastrado');
  });
});
