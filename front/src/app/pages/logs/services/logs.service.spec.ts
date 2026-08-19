import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { LogsService } from './logs.service';
import { environment } from '@env/environment';

describe('LogsService', () => {
  let service: LogsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LogsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request the paginated logs with page and limit', () => {
    service.findAll(2, 20).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/logs` && r.params.get('page') === '2' && r.params.get('limit') === '20'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], total: 0, page: 2, lastPage: 1 });
  });

  it('should request the logs for a specific user email', () => {
    service.findByEmail('maria@teste.com').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/logs/maria%40teste.com`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should url-encode special characters in the email', () => {
    service.findByEmail('maria+teste/x@teste.com').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/logs/${encodeURIComponent('maria+teste/x@teste.com')}`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
