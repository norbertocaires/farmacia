import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ProfileService } from './profile';
import { environment } from '@env/environment';

describe('ProfileService', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;
  const API = `${environment.apiUrl}/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch a profile by id', () => {
    service.getProfile(7).subscribe();

    const req = httpMock.expectOne(`${API}/7`);
    expect(req.request.method).toBe('GET');
    req.flush({ name: 'Maria', email: 'maria@teste.com' });
  });

  it('should update the profile with the given data', () => {
    service.updateProfile('maria@teste.com', { name: 'Maria Silva' }).subscribe();

    const req = httpMock.expectOne(`${API}/maria@teste.com`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: 'Maria Silva' });
    req.flush({ access_token: 'token' });
  });

  it('should list users with pagination and an optional search term', () => {
    service.listUsers(2, 15, 'maria').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === API && r.params.get('page') === '2' && r.params.get('limit') === '15' && r.params.get('search') === 'maria'
    );
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
