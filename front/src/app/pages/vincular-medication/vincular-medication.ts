import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { FarmaciaService } from '../user-medication/services/user-medication.service';
import { UserMedicationDto } from '../user-medication/dto/user-medication.dto';
import type { IScannerControls } from '@zxing/browser';
import { GoogleMapsLoaderService } from '../../common/google-maps/google-maps-loader.service';
import { PharmacyPickerComponent } from '../../components/pharmacy-picker/pharmacy-picker.component';
import { PharmacySelection } from '../../components/pharmacy-picker/pharmacy-selection';

/**
 * Página (não mais modal) de vincular/editar medicamento. Foi convertida de
 * modal pra página própria porque o Google Places Autocomplete, dentro do
 * mat-dialog, brigava com o overlay do Angular Material (z-index) e com a
 * rolagem interna do modal (o dropdown do Google só acompanha scroll/resize
 * da janela, não de um container interno) — como página cheia, o scroll é
 * sempre o da janela, então o problema desaparece pela raiz.
 */
@Component({
  selector: 'app-vincular-medication',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatProgressSpinnerModule, PharmacyPickerComponent
  ],
  templateUrl: './vincular-medication.html',
  styleUrls: ['./vincular-medication.scss']
})
export class VincularMedicationPageComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  loading  = signal(false);
  scanning = signal(false);
  carregandoDetalhes = signal(false);

  editId: string | null = null;
  private detalhes: UserMedicationDto | null = null;

  @ViewChild('videoPreview') videoPreview!: ElementRef<HTMLVideoElement>;

  private scanControls: IScannerControls | null = null;

  readonly isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  constructor(
    private fb: FormBuilder,
    private farmaciaService: FarmaciaService,
    private cdr: ChangeDetectorRef,
    private mapsLoader: GoogleMapsLoaderService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastrService,
  ) { }

  get mapsAvailable(): boolean {
    return this.mapsLoader.isConfigured;
  }

  get isEditMode(): boolean {
    return !!this.editId;
  }

  get pharmacyValue(): PharmacySelection | null {
    const f = this.detalhes?.farmacia;
    return f?.nome ? {
      name: f.nome, address: f.endereco ?? '', placeId: f.placeId ?? '', lat: f.lat ?? 0, lng: f.lng ?? 0,
      iconUrl: f.iconUrl ?? null, iconBackgroundColor: f.iconBackgroundColor ?? null,
    } : null;
  }

  todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.editId = this.route.snapshot.paramMap.get('id');
    this.buildForm();
    this.watchEan();

    if (this.editId) {
      this.carregarDetalhes(this.editId);
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      ean:             [{ value: '', disabled: this.isEditMode }, this.isEditMode ? [] : [Validators.required]],
      medicationId:    [{ value: this.isEditMode ? '__edit__' : '', disabled: false }, Validators.required],
      // Campos de exibição — excluídos do payload no salvar()
      nomeVisual:      [''],
      tipoProduto:     [''],
      substancia:      [''],
      laboratorio:     [''],
      apresentacao:    [''],
      pmcZero:         [null],
      precoFabrica:    [''],
      // Campos enviados ao backend
      pricePaid:       [null, [Validators.required, Validators.min(0.01)]],
      boxQuantity:     [1,    [Validators.required, Validators.min(1)]],
      totalQuantity:   [null, [Validators.required, Validators.min(1)]],
      dosage:          [1,    [Validators.required, Validators.min(0.1)]],
      frequencyPerDay: [1,    [Validators.required, Validators.min(1)]],
      dataCompra:      [this.todayIso(), [
        (control: import('@angular/forms').AbstractControl) => control.value && control.value > this.todayIso() ? { futureDate: true } : null
      ]],
      // Farmácia onde comprou — opcional, preenchida pelo seletor do Google Places
      pharmacyName:    [null],
      pharmacyAddress: [null],
      pharmacyPlaceId: [null],
      pharmacyLat:     [null],
      pharmacyLng:     [null],
      pharmacyIconUrl:             [null],
      pharmacyIconBackgroundColor: [null],
    });
  }

  private watchEan(): void {
    this.form.get('ean')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(value => {
        this.form.patchValue(
          { medicationId: '', nomeVisual: '', tipoProduto: '', substancia: '', laboratorio: '', apresentacao: '', pmcZero: null, precoFabrica: null },
          { emitEvent: false }
        );
        this.form.get('ean')?.setErrors(null, { emitEvent: false });

        if (value && value.length >= 8) {
          this.loading.set(true);
          return this.farmaciaService.buscarPorNome(value);
        }
        return of([]);
      })
    ).subscribe({
      next: (results: any[]) => {
        this.loading.set(false);
        if (results && results.length > 0) {
          this.aplicarResultadoBusca(results[0]);
        } else if (results && results.length === 0 && this.form.get('ean')!.value?.length >= 8) {
          this.form.get('ean')?.setErrors({ notFound: true }, { emitEvent: false });
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.form.get('ean')?.setErrors({ notFound: true }, { emitEvent: false });
        this.cdr.markForCheck();
      }
    });
  }

  private carregarDetalhes(id: string): void {
    this.carregandoDetalhes.set(true);
    this.farmaciaService.getById(id).subscribe({
      next: (detalhes) => {
        this.detalhes = detalhes;
        if (detalhes.medicamento) this.aplicarResultadoBusca(detalhes.medicamento);
        this.form.patchValue({
          ean:             detalhes.ean ?? '',
          pricePaid:       detalhes.pricePaid       ?? null,
          boxQuantity:     detalhes.boxQuantity      ?? 1,
          totalQuantity:   detalhes.totalQuantity    ?? null,
          dosage:          detalhes.dosage           ?? 1,
          frequencyPerDay: detalhes.frequencyPerDay  ?? 1,
          dataCompra:      detalhes.dataCompra ? detalhes.dataCompra.split('T')[0] : this.todayIso(),
          pharmacyName:    this.pharmacyValue?.name    ?? null,
          pharmacyAddress: this.pharmacyValue?.address ?? null,
          pharmacyPlaceId: this.pharmacyValue?.placeId ?? null,
          pharmacyLat:     this.pharmacyValue?.lat     ?? null,
          pharmacyLng:     this.pharmacyValue?.lng     ?? null,
          pharmacyIconUrl:             this.pharmacyValue?.iconUrl             ?? null,
          pharmacyIconBackgroundColor: this.pharmacyValue?.iconBackgroundColor ?? null,
        }, { emitEvent: false });
        this.carregandoDetalhes.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        // Sem os dados completos não é seguro mostrar o formulário: os campos que
        // faltarem cairiam nos defaults e sobrescreveriam o registro real ao salvar.
        this.carregandoDetalhes.set(false);
        this.toast.error('Não foi possível carregar os dados desse medicamento para edição. Tente novamente.');
        this.router.navigate(['/dashboard']);
      }
    });
  }

  onPharmacySelected(selection: PharmacySelection | null): void {
    this.form.patchValue({
      pharmacyName:    selection?.name    ?? null,
      pharmacyAddress: selection?.address ?? null,
      pharmacyPlaceId: selection?.placeId ?? null,
      pharmacyLat:     selection?.lat     ?? null,
      pharmacyLng:     selection?.lng     ?? null,
      pharmacyIconUrl:             selection?.iconUrl             ?? null,
      pharmacyIconBackgroundColor: selection?.iconBackgroundColor ?? null,
    });
  }

  private aplicarResultadoBusca(r: any): void {
    this.form.patchValue({
      medicationId: r.id,
      nomeVisual:   r.produto,
      ...(r.ean ? { ean: r.ean } : {}),
      tipoProduto:  r.tipoProduto  ?? '',
      substancia:   r.substancia   ?? '',
      laboratorio:  r.laboratorio  ?? '',
      apresentacao: r.apresentacao ?? '',
      pmcZero:      r.pmcZero      ?? null,
      precoFabrica: r.precoFabrica ?? null,
    }, { emitEvent: false });
  }

  async startScan() {
    this.scanning.set(true);
    this.cdr.detectChanges();
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      this.scanControls = await reader.decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        this.videoPreview.nativeElement,
        (result: any) => {
          if (result) {
            this.form.get('ean')?.setValue(result.getText());
            this.stopScan();
          }
        }
      );
    } catch {
      this.stopScan();
    }
  }

  stopScan() {
    this.scanControls?.stop();
    this.scanControls = null;
    const video = this.videoPreview?.nativeElement;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
    this.scanning.set(false);
  }

  ngOnDestroy() {
    this.stopScan();
  }

  cancelar(): void {
    this.router.navigate(['/dashboard']);
  }

  salvar() {
    if (this.form.valid) {
      this.loading.set(true);
      const { ean, nomeVisual, tipoProduto, substancia, laboratorio, apresentacao, pmcZero, precoFabrica, medicationId, dataCompra, ...rest } = this.form.value;
      const dataCompraIso  = dataCompra ? new Date(dataCompra + 'T12:00:00').toISOString() : null;
      const payload = { ...rest, purchaseDate: dataCompraIso };

      if (this.isEditMode) {
        this.farmaciaService.atualizarVinculo(this.editId!, payload).subscribe({
          next: () => { this.loading.set(false); this.router.navigate(['/dashboard']); },
          error: () => this.loading.set(false)
        });
      } else {
        this.farmaciaService.vincularRemedio({ medicationId, ...payload }).subscribe({
          next: () => { this.loading.set(false); this.router.navigate(['/dashboard']); },
          error: () => this.loading.set(false)
        });
      }
    }
  }
}
