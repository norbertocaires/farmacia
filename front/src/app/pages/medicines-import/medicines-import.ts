import { Observable } from 'rxjs';
import { Component, inject, signal } from '@angular/core';
import { SHARED_IMPORTS } from '../../shared-imports';
import { MedicineImportService } from './services/medicine-import.service';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-import-medicines',
  standalone: true,
  imports: [...SHARED_IMPORTS],
  templateUrl: './medicines-import.html',
  styleUrl: './medicines-import.scss'
})
export class ImportMedicinesComponent {
  private medicineService = inject(MedicineImportService);
  private toast = inject(ToastrService);
 // private syncService = inject(SyncService);

  progress$: Observable<any> | undefined;

  isDragging = signal(false);
  isLoading = signal(false);
  selectedFile: File | null = null;

  ngOnInit() {
   // this.progress$ = this.syncService.getProgress();
  }

  // Acionado quando seleciona pelo botão
  onFileSelected(event: any, input: HTMLInputElement) {
    const file = event.target.files[0];
    
    if (file) {
      this.prepareUpload(file);
      input.value = ''; 
    }
  }

  // Acionado pelo Drag & Drop
  onFileDropped(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.prepareUpload(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave() {
    this.isDragging.set(false);
  }

  private prepareUpload(file: File) {
    // Validação simples de formato
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      this.selectedFile = file;
    } else {
      this.toast.error('Por favor, selecione apenas arquivos Excel (.xlsx)');
    }
  }

  upload() {
    if (!this.selectedFile) return;

    this.isLoading.set(true);
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.medicineService.importExcel(formData).subscribe({
      next: (res) => {
        //this.toast.success('Medicamentos importados com sucesso!');
        this.selectedFile = null;
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toast.error('Erro ao processar a planilha.');
        this.isLoading.set(false);
      }
    });
  }
}