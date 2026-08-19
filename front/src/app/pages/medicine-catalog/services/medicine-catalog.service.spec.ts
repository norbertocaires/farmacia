import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { MedicineCatalogService } from './medicine-catalog.service';
import { environment } from '@env/environment';

describe('MedicineCatalogService', () => {
  let service: MedicineCatalogService;
  let httpMock: HttpTestingController;
  const API = `${environment.apiUrl}/medicines`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MedicineCatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a medicine in the catalog', () => {
    const medicine = { name: 'Dipirona' };
    service.create(medicine).subscribe();

    const req = httpMock.expectOne(API);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(medicine);
    req.flush(medicine);
  });

  it('should search medicines by term', () => {
    service.search('dipirona').subscribe();

    const req = httpMock.expectOne(`${API}/search?term=dipirona`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should fetch the paginated catalog using the filter payload', () => {
    const filter = { page: 1, limit: 15, produto: 'Dorflex' } as any;
    service.getCatalog(filter).subscribe();

    const req = httpMock.expectOne(`${API}/findAll`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(filter);
    req.flush({ data: [], total: 0, page: 1, lastPage: 1 });
  });
});
