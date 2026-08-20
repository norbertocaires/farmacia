import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LogsService } from './services/logs.service';
import { ActivityLog } from './dto/activity-log.dto';
import { PageSizeSelectComponent } from '../../components/page-size-select/page-size-select.component';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, PageSizeSelectComponent],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.scss'
})
export class LogsComponent implements OnInit {
  private logsService = inject(LogsService);
  private cdr = inject(ChangeDetectorRef);

  logs: ActivityLog[] = [];
  loading = false;

  searchEmail = '';

  page = 1;
  limit = 10;
  totalLogs = 0;
  totalPages = 1;

  expandedLogIds = new Set<number>();

  get isFiltrandoPorEmail(): boolean {
    return this.searchEmail.trim().length > 0;
  }

  ngOnInit(): void {
    this.carregarLogs();
  }

  carregarLogs(): void {
    this.loading = true;
    this.cdr.markForCheck();

    if (this.isFiltrandoPorEmail) {
      this.logsService.findByEmail(this.searchEmail.trim()).subscribe({
        next: (logs) => {
          this.logs = logs;
          this.totalLogs = logs.length;
          this.totalPages = 1;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => this.onErro()
      });
      return;
    }

    this.logsService.findAll(this.page, this.limit).subscribe({
      next: (res) => {
        this.logs = res.data;
        this.totalLogs = res.total;
        this.totalPages = res.lastPage;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => this.onErro()
    });
  }

  buscar(): void {
    this.page = 1;
    this.carregarLogs();
  }

  limparBusca(): void {
    this.searchEmail = '';
    this.page = 1;
    this.carregarLogs();
  }

  onLimitChange(newLimit: number): void {
    this.limit = newLimit;
    this.page = 1;
    this.carregarLogs();
  }

  changePage(page: number): void {
    this.page = Math.min(Math.max(page, 1), this.totalPages);
    this.carregarLogs();
  }

  toggleDetalhes(log: ActivityLog): void {
    if (this.expandedLogIds.has(log.id)) {
      this.expandedLogIds.delete(log.id);
    } else {
      this.expandedLogIds.add(log.id);
    }
  }

  temMetadata(log: ActivityLog): boolean {
    return !!log.metadata && Object.keys(log.metadata).length > 0;
  }

  metadataFormatada(log: ActivityLog): string {
    return JSON.stringify(log.metadata, null, 2);
  }

  formatLocation(log: ActivityLog): string {
    const loc = log.location;
    if (!loc) return '';
    return [loc.city, loc.region, loc.country].filter(Boolean).join(', ');
  }

  actionClass(action: string): string {
    const a = (action || '').toLowerCase();
    if (a.includes('delet') || a.includes('remov') || a.includes('exclu')) return 'danger';
    if (a.includes('login') || a.includes('logout') || a.includes('auth')) return 'info';
    if (a.includes('creat') || a.includes('add') || a.includes('vincul') || a.includes('regist')) return 'success';
    if (a.includes('updat') || a.includes('edit') || a.includes('atualiz')) return 'warning';
    return 'default';
  }

  private onErro(): void {
    this.logs = [];
    this.totalLogs = 0;
    this.totalPages = 1;
    this.loading = false;
    this.cdr.markForCheck();
  }
}
