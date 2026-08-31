import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { VincularMedicationModalComponent } from './vincular-medication';
import { FarmaciaService } from '../../pages/user-medication/services/user-medication.service';

describe('VincularMedicationModalComponent', () => {
  let fixture: ComponentFixture<VincularMedicationModalComponent>;
  let component: VincularMedicationModalComponent;
  let farmaciaService: {
    buscarPorNome: ReturnType<typeof vi.fn>;
    vincularRemedio: ReturnType<typeof vi.fn>;
    atualizarVinculo: ReturnType<typeof vi.fn>;
  };
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  const searchResult = {
    id: 'med-1',
    produto: 'Dipirona 500mg',
    ean: '7891234567890',
    tipoProduto: 'Genérico',
    substancia: 'Dipirona Sódica',
    laboratorio: 'Medley',
    apresentacao: 'Comprimido',
    pmcZero: 12.5,
    precoFabrica: 8.2,
  };

  function setup(data: any) {
    farmaciaService = {
      buscarPorNome: vi.fn(() => of([searchResult])),
      vincularRemedio: vi.fn(() => of({ ok: true })),
      atualizarVinculo: vi.fn(() => of({ ok: true })),
    };
    dialogRef = { close: vi.fn() };

    return TestBed.configureTestingModule({
      imports: [VincularMedicationModalComponent],
      providers: [
        { provide: FarmaciaService, useValue: farmaciaService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('add mode', () => {
    beforeEach(async () => {
      vi.useFakeTimers();
      await setup({});
      fixture = TestBed.createComponent(VincularMedicationModalComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create with the ean field enabled and required', () => {
      expect(component).toBeTruthy();
      expect(component.isEditMode).toBe(false);
      expect(component.form.get('ean')?.disabled).toBe(false);
    });

    it('should search and fill the medicine data once the ean is typed', async () => {
      component.form.get('ean')?.setValue('7891234567890');
      vi.advanceTimersByTime(500);
      await Promise.resolve();

      expect(farmaciaService.buscarPorNome).toHaveBeenCalledWith('7891234567890');
      expect(component.form.get('medicationId')?.value).toBe('med-1');
      expect(component.form.get('nomeVisual')?.value).toBe('Dipirona 500mg');
      expect(component.form.get('laboratorio')?.value).toBe('Medley');
    });

    it('should call vincularRemedio with the medicationId on save', async () => {
      component.form.get('ean')?.setValue('7891234567890');
      vi.advanceTimersByTime(500);
      await Promise.resolve();

      component.form.patchValue({ pricePaid: 10, totalQuantity: 30 });
      component.salvar();

      expect(farmaciaService.vincularRemedio).toHaveBeenCalled();
      const payload = farmaciaService.vincularRemedio.mock.calls[0][0];
      expect(payload.medicationId).toBe('med-1');
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should not show the pharmacy picker when no Google Maps API key is configured', () => {
      // Sem GOOGLE_MAPS_API_KEY no ambiente de teste (environment.ts fica vazio de propósito)
      expect(component.mapsAvailable).toBe(false);
      expect(fixture.nativeElement.querySelector('app-pharmacy-picker')).toBeNull();
    });

    it('should patch the pharmacy fields when a place is selected, and include them on save', async () => {
      component.form.get('ean')?.setValue('7891234567890');
      vi.advanceTimersByTime(500);
      await Promise.resolve();
      component.form.patchValue({ pricePaid: 10, totalQuantity: 30 });

      component.onPharmacySelected({
        name: 'Farmácia São Paulo',
        address: 'Av. Paulista, 1000 - São Paulo, SP',
        placeId: 'ChIJ_abc123',
        lat: -23.561684,
        lng: -46.655981,
      });

      expect(component.form.get('pharmacyName')?.value).toBe('Farmácia São Paulo');
      expect(component.form.get('pharmacyPlaceId')?.value).toBe('ChIJ_abc123');

      component.salvar();

      const payload = farmaciaService.vincularRemedio.mock.calls[0][0];
      expect(payload.pharmacyName).toBe('Farmácia São Paulo');
      expect(payload.pharmacyAddress).toBe('Av. Paulista, 1000 - São Paulo, SP');
      expect(payload.pharmacyPlaceId).toBe('ChIJ_abc123');
      expect(payload.pharmacyLat).toBe(-23.561684);
      expect(payload.pharmacyLng).toBe(-46.655981);
    });

    it('should clear the pharmacy fields when the selection is removed', async () => {
      component.onPharmacySelected({ name: 'X', address: 'Y', placeId: 'z', lat: 1, lng: 2 });
      component.onPharmacySelected(null);

      expect(component.form.get('pharmacyName')?.value).toBeNull();
      expect(component.form.get('pharmacyLat')?.value).toBeNull();
    });
  });

  describe('edit mode', () => {
    beforeEach(async () => {
      await setup({
        editMode: true,
        id: 42,
        ean: '7891234567890',
        medicamento: searchResult,
        pricePaid: 9.9,
        boxQuantity: 1,
        totalQuantity: 30,
        dosage: 1,
        frequencyPerDay: 2,
        dataCompra: null,
      });
      fixture = TestBed.createComponent(VincularMedicationModalComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should disable the ean field and prefill data from "medicamento"', () => {
      expect(component.isEditMode).toBe(true);
      expect(component.form.get('ean')?.disabled).toBe(true);
      expect(component.form.get('nomeVisual')?.value).toBe('Dipirona 500mg');
      expect(component.form.get('laboratorio')?.value).toBe('Medley');
      expect(component.form.get('ean')?.value).toBe('7891234567890');
    });

    it('should show both the factory price and the PMC (Preço Máximo Consumidor)', () => {
      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('Preço Máximo Fábrica');
      expect(text).toContain('Preço Máximo Consumidor');
    });

    it('should call atualizarVinculo with the linked id on save', () => {
      component.salvar();

      expect(farmaciaService.atualizarVinculo).toHaveBeenCalled();
      expect(farmaciaService.atualizarVinculo.mock.calls[0][0]).toBe(42);
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });
  });
});
