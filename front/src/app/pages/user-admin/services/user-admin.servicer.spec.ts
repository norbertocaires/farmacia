import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { UserAdminService } from './user-admin.servicer';
import { UserRole } from '../dto/User';
import { environment } from '@env/environment';

describe('UserAdminService', () => {
  let service: UserAdminService;
  let httpMock: HttpTestingController;
  const API = `${environment.apiUrl}/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserAdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should search users with the findAll payload', () => {
    const search = { page: 1, limit: 15 };
    service.findAll(search).subscribe();

    const req = httpMock.expectOne(`${API}/findAll`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(search);
    req.flush({ data: [], total: 0 });
  });

  it('should toggle a user active status', () => {
    service.toggleStatus('maria@teste.com', false).subscribe();

    const req = httpMock.expectOne(`${API}/maria@teste.com/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ isActive: false });
    req.flush({});
  });

  it('should update a user role', () => {
    service.updateRole('maria@teste.com', UserRole.ADMIN).subscribe();

    const req = httpMock.expectOne(`${API}/maria@teste.com/role`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ role: UserRole.ADMIN });
    req.flush({});
  });

  it('should delete a user', () => {
    service.delete('maria@teste.com').subscribe();

    const req = httpMock.expectOne(`${API}/maria@teste.com`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
