import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PharmacyPickerComponent } from './pharmacy-picker.component';
import { GoogleMapsLoaderService } from '../../common/google-maps/google-maps-loader.service';

describe('PharmacyPickerComponent', () => {
  let fixture: ComponentFixture<PharmacyPickerComponent>;
  let component: PharmacyPickerComponent;

  describe('sem GOOGLE_MAPS_API_KEY configurada', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [PharmacyPickerComponent],
        providers: [{ provide: GoogleMapsLoaderService, useValue: { isConfigured: false, load: () => Promise.reject() } }],
      }).compileComponents();

      fixture = TestBed.createComponent(PharmacyPickerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should mark itself unavailable and render nothing', () => {
      expect(component.unavailable()).toBe(true);
      expect(fixture.nativeElement.querySelector('.pharmacy-picker')).toBeNull();
    });
  });

  describe('com GOOGLE_MAPS_API_KEY configurada mas a API falha ao carregar', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [PharmacyPickerComponent],
        providers: [{ provide: GoogleMapsLoaderService, useValue: { isConfigured: true, load: () => Promise.reject(new Error('network')) } }],
      }).compileComponents();

      fixture = TestBed.createComponent(PharmacyPickerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should render the search box but show a friendly load-error message', () => {
      fixture.detectChanges(); // garante que o DOM reflete o loadError já setado (rejeição resolveu como microtask)

      expect(component.unavailable()).toBe(false);
      expect(component.loadError()).toBe(true);
      expect(fixture.nativeElement.querySelector('.pharmacy-picker')).toBeTruthy();
      expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar o mapa');
    });
  });

  describe('clear()', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [PharmacyPickerComponent],
        providers: [{ provide: GoogleMapsLoaderService, useValue: { isConfigured: true, load: () => new Promise(() => {}) } }],
      }).compileComponents();

      fixture = TestBed.createComponent(PharmacyPickerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should emit null and clear the current selection', () => {
      const emitted: (import('./pharmacy-selection').PharmacySelection | null)[] = [];
      component.valueChange.subscribe((v) => emitted.push(v));

      component.selected.set({ name: 'Farmácia X', address: 'Rua Y, 123', placeId: 'abc', lat: -23.5, lng: -46.6 });
      component.clear();

      expect(component.selected()).toBeNull();
      expect(emitted).toEqual([null]);
    });
  });

  describe('selecionarRecente()', () => {
    beforeEach(async () => {
      // O mapa nunca termina de carregar (load() nunca resolve) — igual ao
      // describe de clear() acima. selecionarRecente() precisa continuar
      // funcionando (emitir a seleção) mesmo que o mapa ainda não exista,
      // já que os chips de "recentes" aparecem antes do Maps terminar de
      // carregar (a consulta é só ao nosso próprio backend).
      await TestBed.configureTestingModule({
        imports: [PharmacyPickerComponent],
        providers: [{ provide: GoogleMapsLoaderService, useValue: { isConfigured: true, load: () => new Promise(() => {}) } }],
      }).compileComponents();

      fixture = TestBed.createComponent(PharmacyPickerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should select the pharmacy and emit it even before the map has loaded', () => {
      const emitted: (import('./pharmacy-selection').PharmacySelection | null)[] = [];
      component.valueChange.subscribe((v) => emitted.push(v));

      const farmacia = { name: 'Farmácia X', address: 'Rua Y, 123', placeId: 'abc', lat: -23.5, lng: -46.6 };
      component.selecionarRecente(farmacia);

      expect(component.selected()).toEqual(farmacia);
      expect(emitted).toEqual([farmacia]);
    });
  });
});
