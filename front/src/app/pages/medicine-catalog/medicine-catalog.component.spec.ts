import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';

import { MedicineCatalogComponent } from './medicine-catalog.component';
import { MedicineCatalogService } from './services/medicine-catalog.service';

describe('MedicineCatalogComponent', () => {
  let component: MedicineCatalogComponent;
  let fixture: ComponentFixture<MedicineCatalogComponent>;
  let medService: { getCatalog: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    medService = {
      getCatalog: vi.fn(() => of({ data: [{ id: 1, produto: 'Dipirona' }], total: 1, lastPage: 1 })),
    };
    toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [MedicineCatalogComponent],
      providers: [
        { provide: MedicineCatalogService, useValue: medService },
        { provide: ToastrService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicineCatalogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load the catalog on init', () => {
    expect(component).toBeTruthy();
    expect(medService.getCatalog).toHaveBeenCalled();
    expect(component.medicines.length).toBe(1);
    expect(component.totalItems).toBe(1);
  });

  it('should reset the filters and reload', () => {
    component.filtros.produto = 'Dorflex';
    medService.getCatalog.mockClear();

    component.limparFiltros();

    expect(component.filtros.produto).toBeUndefined();
    expect(component.filtros.page).toBe(1);
    expect(medService.getCatalog).toHaveBeenCalled();
  });

  it('should clamp the page number to the valid range instead of ignoring it', () => {
    medService.getCatalog.mockReturnValue(of({ data: [], total: 30, lastPage: 3 }));
    component.lastPage = 3;
    medService.getCatalog.mockClear();

    component.changePage(0);
    expect(component.filtros.page).toBe(1);
    expect(medService.getCatalog).toHaveBeenCalled();

    medService.getCatalog.mockClear();
    component.changePage(99);
    expect(component.filtros.page).toBe(3);
    expect(medService.getCatalog).toHaveBeenCalled();
  });

  it('should debounce filter changes instead of firing a request per keystroke', () => {
    vi.useFakeTimers();
    medService.getCatalog.mockClear();

    component.onFilterChange();
    component.onFilterChange();
    component.onFilterChange();
    expect(medService.getCatalog).not.toHaveBeenCalled();

    vi.advanceTimersByTime(400);
    expect(medService.getCatalog).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should stop loading and show a toast when the catalog request fails', () => {
    medService.getCatalog.mockReturnValue(throwError(() => new Error('falhou')));

    component.limparFiltros();

    expect(component.loading()).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });
});
