import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { FarmaciaService } from './user-medication.service';
import { environment } from 'src/environments/environment';

describe('FarmaciaService', () => {
  let service: FarmaciaService;
  let httpMock: HttpTestingController;
  const API = `${environment.apiUrl}/meus-remedios`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FarmaciaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should request the resumo por periodo with inicio and fim joined by &', () => {
    service.getResumoByPeriodo('2026-04-01', '2026-07-01').subscribe();

    const req = httpMock.expectOne(`${API}/resumo/periodo?inicio=2026-04-01&fim=2026-07-01`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should link a medication', () => {
    const payload = {
      medicationId: '1',
      pricePaid: 10,
      boxQuantity: 1,
      totalQuantity: 30,
      dosage: 1,
      frequencyPerDay: 2,
      purchaseDate: null,
    };

    service.vincularRemedio(payload).subscribe();

    const req = httpMock.expectOne(`${API}/vincular`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('should update a linked medication', () => {
    service.atualizarVinculo(5, {
      pricePaid: 10,
      boxQuantity: 1,
      totalQuantity: 30,
      dosage: 1,
      frequencyPerDay: 2,
      purchaseDate: null,
    }).subscribe();

    const req = httpMock.expectOne(`${API}/5`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('should delete a linked medication', () => {
    service.excluirVinculo(5).subscribe();

    const req = httpMock.expectOne(`${API}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should search medicines by term against the catalog search endpoint', () => {
    service.buscarPorNome('7891234567890').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/medicines/search` && r.params.get('term') === '7891234567890'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
