import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';

import { ImportMedicinesComponent } from './medicines-import';
import { MedicineImportService } from './services/medicine-import.service';

describe('ImportMedicinesComponent', () => {
  let component: ImportMedicinesComponent;
  let fixture: ComponentFixture<ImportMedicinesComponent>;
  let medicineService: { importExcel: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };

  const excelFile = new File(['conteudo'], 'planilha.xlsx', { type: 'application/vnd.ms-excel' });
  const textFile = new File(['conteudo'], 'nota.txt', { type: 'text/plain' });

  beforeEach(async () => {
    medicineService = { importExcel: vi.fn(() => of({})) };
    toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ImportMedicinesComponent],
      providers: [
        { provide: MedicineImportService, useValue: medicineService },
        { provide: ToastrService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportMedicinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept a valid .xlsx file selected via the input', () => {
    const input = document.createElement('input');
    component.onFileSelected({ target: { files: [excelFile] } }, input);

    expect(component.selectedFile).toBe(excelFile);
  });

  it('should reject files that are not Excel spreadsheets', () => {
    const input = document.createElement('input');
    component.onFileSelected({ target: { files: [textFile] } }, input);

    expect(component.selectedFile).toBeNull();
    expect(toast.error).toHaveBeenCalled();
  });

  it('should accept a file dropped onto the dropzone', () => {
    const dataTransfer = { files: [excelFile] } as unknown as DataTransfer;
    const event = { preventDefault: vi.fn(), dataTransfer } as unknown as DragEvent;

    component.onFileDropped(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.isDragging()).toBe(false);
    expect(component.selectedFile).toBe(excelFile);
  });

  it('should upload the selected file and clear it afterwards', () => {
    const input = document.createElement('input');
    component.onFileSelected({ target: { files: [excelFile] } }, input);

    component.upload();

    expect(medicineService.importExcel).toHaveBeenCalled();
    const formData = medicineService.importExcel.mock.calls[0][0] as FormData;
    expect(formData.get('file')).toBe(excelFile);
    expect(component.selectedFile).toBeNull();
    expect(component.isLoading()).toBe(false);
  });

  it('should do nothing when uploading without a selected file', () => {
    component.upload();
    expect(medicineService.importExcel).not.toHaveBeenCalled();
  });
});
