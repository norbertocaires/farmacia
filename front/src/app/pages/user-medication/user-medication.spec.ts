import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { ListagemComponent } from './user-medication';
import { UserMedicationDto } from './dto/user-medication.dto';
import { environment } from '@env/environment';

describe('ListagemComponent', () => {
  let component: ListagemComponent;
  let fixture: ComponentFixture<ListagemComponent>;
  let httpMock: HttpTestingController;
  const router = { navigate: vi.fn() };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-20T12:00:00'));
    router.navigate.mockClear();

    await TestBed.configureTestingModule({
      imports: [ListagemComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListagemComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default the period to the last 3 months and request it on init', () => {
    fixture.detectChanges();

    const req = httpMock.expectOne(
      `${environment.apiUrl}/meus-remedios/resumo/periodo?inicio=2026-04-20&fim=2026-07-20`
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);

    expect(component.periodoInicio).toBe('2026-04-20');
    expect(component.periodoFim).toBe('2026-07-20');
    expect(component.loading).toBe(false);
  });

  it('should group the loaded items by month and day', () => {
    fixture.detectChanges();

    const dados: Partial<UserMedicationDto>[] = [
      { id: 1, nome: 'Dipirona', dataCompra: '2026-07-10T00:00:00.000Z', criadoEm: new Date('2026-07-10') },
      { id: 2, nome: 'Paracetamol', dataCompra: '2026-07-10T00:00:00.000Z', criadoEm: new Date('2026-07-10') },
      { id: 3, nome: 'Ibuprofeno', dataCompra: '2026-06-05T00:00:00.000Z', criadoEm: new Date('2026-06-05') },
    ];

    const req = httpMock.expectOne(
      `${environment.apiUrl}/meus-remedios/resumo/periodo?inicio=2026-04-20&fim=2026-07-20`
    );
    req.flush(dados as UserMedicationDto[]);

    expect(component.minhaFarmacia.length).toBe(3);
    expect(component.farmaciaAgrupada.length).toBe(2);

    const julho = component.farmaciaAgrupada.find(g => g.monthKey === '2026-07')!;
    expect(julho.days.length).toBe(1);
    expect(julho.days[0].items.map(i => i.id)).toEqual([1, 2]);

    const junho = component.farmaciaAgrupada.find(g => g.monthKey === '2026-06')!;
    expect(junho.days[0].items.map(i => i.id)).toEqual([3]);
  });

  it('should total the amount actually paid (pricePaid) per month', () => {
    fixture.detectChanges();

    const dados: Partial<UserMedicationDto>[] = [
      { id: 1, nome: 'Dipirona', dataCompra: '2026-07-10T00:00:00.000Z', criadoEm: new Date('2026-07-10'), pricePaid: 15.5 },
      { id: 2, nome: 'Paracetamol', dataCompra: '2026-07-08T00:00:00.000Z', criadoEm: new Date('2026-07-08'), pricePaid: 9.9 },
      { id: 3, nome: 'Ibuprofeno', dataCompra: '2026-06-05T00:00:00.000Z', criadoEm: new Date('2026-06-05'), pricePaid: 20 },
    ];

    httpMock.expectOne(
      `${environment.apiUrl}/meus-remedios/resumo/periodo?inicio=2026-04-20&fim=2026-07-20`
    ).flush(dados as UserMedicationDto[]);

    const julho = component.farmaciaAgrupada.find(g => g.monthKey === '2026-07')!;
    expect(julho.totalMensal).toBeCloseTo(25.4);

    const junho = component.farmaciaAgrupada.find(g => g.monthKey === '2026-06')!;
    expect(junho.totalMensal).toBeCloseTo(20);
  });

  it('should reload data with the new period when filtering', () => {
    fixture.detectChanges();
    httpMock.expectOne(
      `${environment.apiUrl}/meus-remedios/resumo/periodo?inicio=2026-04-20&fim=2026-07-20`
    ).flush([]);

    component.periodoInicio = '2026-01-01';
    component.periodoFim = '2026-02-01';
    component.filtrarPorPeriodo();

    const req = httpMock.expectOne(
      `${environment.apiUrl}/meus-remedios/resumo/periodo?inicio=2026-01-01&fim=2026-02-01`
    );
    req.flush([]);
  });

  it('should navigate to the vincular-medicamento page when adding a new medication', () => {
    fixture.detectChanges();
    httpMock.expectOne(
      `${environment.apiUrl}/meus-remedios/resumo/periodo?inicio=2026-04-20&fim=2026-07-20`
    ).flush([]);

    component.abrirModalVincular();

    expect(router.navigate).toHaveBeenCalledWith(['/vincular-medicamento']);
  });

  it('should navigate to the vincular-medicamento edit page with the item id', () => {
    fixture.detectChanges();
    httpMock.expectOne(
      `${environment.apiUrl}/meus-remedios/resumo/periodo?inicio=2026-04-20&fim=2026-07-20`
    ).flush([]);

    component.abrirModalEditar({ id: 5, nome: 'Dipirona', substancia: 'Dipirona' } as UserMedicationDto);

    expect(router.navigate).toHaveBeenCalledWith(['/vincular-medicamento', 5]);
  });
});
