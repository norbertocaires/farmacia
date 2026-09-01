import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FarmaciaService } from './services/user-medication.service';
import { UserMedicationDto } from './dto/user-medication.dto';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from '@core/confirm-dialog/confirm-dialog';

export interface DayGroup {
  dayLabel: string;
  dateIso: string;
  items: UserMedicationDto[];
}

export interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  totalMensal: number;
  days: DayGroup[];
}

@Component({
  selector: 'app-listagem-farmacia',
  templateUrl: './user-medication.html',
  styleUrls: ['./user-medication.scss'],
  imports: [CurrencyPipe, CommonModule, FormsModule, ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListagemComponent implements OnInit {
  minhaFarmacia: UserMedicationDto[] = [];
  farmaciaAgrupada: MonthGroup[] = [];
  loading = true;

  periodoInicio = '';
  periodoFim = '';

  confirmDialog = { visible: false, item: null as UserMedicationDto | null };

  constructor(
    private farmaciaService: FarmaciaService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.definirPeriodoPadrao();
    this.carregarDados();
  }

  carregarDados(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.farmaciaService.getResumoByPeriodo(this.periodoInicio, this.periodoFim).subscribe({
      next: (dados) => {
        this.minhaFarmacia = [...dados].sort(
          (a, b) => this.resolveDate(b).getTime() - this.resolveDate(a).getTime()
        );
        this.farmaciaAgrupada = this.agruparPorMes(this.minhaFarmacia);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  filtrarPorPeriodo(): void {
    this.carregarDados();
  }

  resumoPosologia(item: UserMedicationDto): string {
    const partes: string[] = [];
    if (item.dosage) partes.push(`${item.dosage} comp.`);
    if (item.frequencyPerDay) partes.push(`${item.frequencyPerDay}x/dia`);
    if (item.boxQuantity) partes.push(`${item.boxQuantity} cx`);
    if (item.totalQuantity) partes.push(`${item.totalQuantity} comp./cx`);
    return partes.join(' · ');
  }

  private definirPeriodoPadrao(): void {
    const hoje = new Date();
    const inicio = new Date();
    inicio.setMonth(inicio.getMonth() - 3);

    this.periodoFim = this.formatarData(hoje);
    this.periodoInicio = this.formatarData(inicio);
  }

  private formatarData(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private resolveDate(item: UserMedicationDto): Date {
    return item.dataCompra ? new Date(item.dataCompra) : new Date(item.criadoEm);
  }

  private agruparPorMes(items: UserMedicationDto[]): MonthGroup[] {
    const meses = new Map<string, Map<string, UserMedicationDto[]>>();

    for (const item of items) {
      const date = this.resolveDate(item);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const dayKey = date.toISOString().split('T')[0];

      if (!meses.has(monthKey)) meses.set(monthKey, new Map());
      const diasDoMes = meses.get(monthKey)!;
      if (!diasDoMes.has(dayKey)) diasDoMes.set(dayKey, []);
      diasDoMes.get(dayKey)!.push(item);
    }

    return Array.from(meses.entries()).map(([monthKey, diasMap]) => {
      const days: DayGroup[] = Array.from(diasMap.entries()).map(([dateIso, itensDoDia]) => ({
        dayLabel: new Date(dateIso + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
        dateIso,
        items: itensDoDia
      }));

      const totalMensal = days
        .flatMap(d => d.items)
        .reduce((soma, item) => soma + (item.pricePaid ?? 0), 0);

      const [year, month] = monthKey.split('-').map(Number);
      const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      return { monthKey, monthLabel, totalMensal, days };
    });
  }

  abrirModalVincular(): void {
    this.router.navigate(['/vincular-medicamento']);
  }

  abrirModalEditar(item: UserMedicationDto): void {
    this.router.navigate(['/vincular-medicamento', item.id]);
  }

  removerMedicacao(item: UserMedicationDto): void {
    this.confirmDialog = { visible: true, item };
    this.cdr.markForCheck();
  }

  confirmarRemocao(): void {
    const item = this.confirmDialog.item;
    this.confirmDialog = { visible: false, item: null };
    if (!item) return;

    item.isDeleting = true;
    this.cdr.markForCheck();

    this.farmaciaService.excluirVinculo(item.id).subscribe({
      next: () => this.carregarDados(),
      error: () => {
        item.isDeleting = false;
        this.cdr.markForCheck();
      }
    });
  }

  cancelarRemocao(): void {
    this.confirmDialog = { visible: false, item: null };
    this.cdr.markForCheck();
  }
}
