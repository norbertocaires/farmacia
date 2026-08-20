// catalog.component.ts
import { Component, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
import { MedicineCatalogService } from './services/medicine-catalog.service';
import { Subject, debounceTime } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { SHARED_IMPORTS } from '@shareImports/shared-imports';
import { GetMedicinesFilterDto } from './dto/get-medicines-filter.dto'
import { PageSizeSelectComponent } from '../../components/page-size-select/page-size-select.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  templateUrl: './medicine-catalog.component.html',
  styleUrl: './medicine-catalog.component.scss',
    imports: [SHARED_IMPORTS, PageSizeSelectComponent],
})
export class MedicineCatalogComponent implements OnInit {
  private medService = inject(MedicineCatalogService);
  private cdr = inject(ChangeDetectorRef);
  private toast = inject(ToastrService);

  limit: number = 10;
  medicines: any[] = [];
  filtros: GetMedicinesFilterDto = {
    page: 1,
    limit: this.limit,
    apresentacao: undefined,
    ean: undefined,
    laboratorio: undefined,
    produto: undefined,
    substancia: undefined
  };

  totalItems = 0;
  lastPage = 1;
  loading = signal(false);

  private filterChange$ = new Subject<void>();

  ngOnInit() {
    this.filterChange$.pipe(debounceTime(400)).subscribe(() => this.carregarCatalogo());
    this.carregarCatalogo();
  }

  // Chamado a cada tecla digitada nos filtros — debounced para não disparar uma requisição por caractere
  onFilterChange() {
    this.filtros.page = 1;
    this.filterChange$.next();
  }

  limparFiltros() {
    this.filtros = { page: 1, limit: this.limit, produto: undefined, substancia: undefined, laboratorio: undefined, apresentacao: undefined, ean: undefined };
    this.carregarCatalogo();
  }

  changePage(newPage: number) {
    // Sempre trava dentro do intervalo válido — o input numérico de página é editável
    // livremente pelo usuário e pode chegar aqui com um valor fora do range.
    this.filtros.page = Math.min(Math.max(newPage, 1), this.lastPage);
    this.carregarCatalogo();
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Experiência melhor para o usuário
  }

  onLimitChange(newLimit: number) {
    this.limit = newLimit;
    this.filtros.limit = newLimit;
    this.filtros.page = 1;
    this.carregarCatalogo();
  }

  private carregarCatalogo() {
    this.loading.set(true);
    this.medService.getCatalog(this.filtros).subscribe({
      next: (res) => {
        this.medicines = [...res.data];
        this.totalItems = res.total;
        this.lastPage = res.lastPage;
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Erro ao buscar medicamentos no catálogo.');
        this.cdr.markForCheck();
      }
    });
  }
}
