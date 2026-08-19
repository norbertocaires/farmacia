import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { MedicineImportService } from './medicine-import.service';
import { environment } from '@env/environment';

describe('MedicineImportService', () => {
  let service: MedicineImportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MedicineImportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should upload the form data to the import endpoint', () => {
    const formData = new FormData();
    formData.append('file', new Blob(['conteudo']), 'planilha.xlsx');

    service.importExcel(formData).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/medicines/import`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(formData);
    req.flush({});
  });
});
