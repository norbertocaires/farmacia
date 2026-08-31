import { ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, signal, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { FarmaciaService } from '../../pages/user-medication/services/user-medication.service';
import type { IScannerControls } from '@zxing/browser';
import { GoogleMapsLoaderService } from '../../common/google-maps/google-maps-loader.service';
import { PharmacyPickerComponent } from '../pharmacy-picker/pharmacy-picker.component';
import { PharmacySelection } from '../pharmacy-picker/pharmacy-selection';

@Component({
  selector: 'app-vincular-medication-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatProgressSpinnerModule, PharmacyPickerComponent
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './vincular-medication.html',
  styleUrls: ['./vincular-medication.scss']
})
export class VincularMedicationModalComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  loading  = signal(false);
  scanning = signal(false);

  @ViewChild('videoPreview') videoPreview!: ElementRef<HTMLVideoElement>;

  private scanControls: IScannerControls | null = null;

  readonly isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  constructor(
    private fb: FormBuilder,
    private farmaciaService: FarmaciaService,
    private cdr: ChangeDetectorRef,
    private mapsLoader: GoogleMapsLoaderService,
    public dialogRef: MatDialogRef<VincularMedicationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  get mapsAvailable(): boolean {
    return this.mapsLoader.isConfigured;
  }

  get pharmacyValue(): PharmacySelection | null {
    const f = this.data?.farmacia;
    return f?.nome ? {
      name: f.nome, address: f.endereco ?? '', placeId: f.placeId ?? '', lat: f.lat ?? 0, lng: f.lng ?? 0,
      iconUrl: f.iconUrl ?? null, iconBackgroundColor: f.iconBackgroundColor ?? null,
    } : null;
  }

  todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }

  get isEditMode(): boolean {
    return !!this.data?.editMode;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      ean:             [{ value: this.data?.ean ?? '', disabled: this.isEditMode }, this.isEditMode ? [] : [Validators.required]],
      medicationId:    [{ value: this.isEditMode ? '__edit__' : '', disabled: false }, Validators.required],
      // Campos de exibição — excluídos do payload no salvar()
      nomeVisual:      [this.data?.nome ?? ''],
      tipoProduto:     [''],
      substancia:      [this.data?.substancia ?? ''],
      laboratorio:     [''],
      apresentacao:    [''],
      pmcZero:         [null],
      precoFabrica:    [''],
      // Campos enviados ao backend
      pricePaid:       [this.data?.pricePaid       ?? null, [Validators.required, Validators.min(0.01)]],
      boxQuantity:     [this.data?.boxQuantity     ?? 1,    [Validators.required, Validators.min(1)]],
      totalQuantity:   [this.data?.totalQuantity   ?? null, [Validators.required, Validators.min(1)]],
      dosage:          [this.data?.dosage          ?? 1,    [Validators.required, Validators.min(0.1)]],
      frequencyPerDay: [this.data?.frequencyPerDay ?? 1,    [Validators.required, Validators.min(1)]],
      dataCompra:      [this.data?.dataCompra ? this.data.dataCompra.split('T')[0] : this.todayIso(), [
        (control: import('@angular/forms').AbstractControl) => control.value && control.value > this.todayIso() ? { futureDate: true } : null
      ]],
      // Farmácia onde comprou — opcional, preenchida pelo seletor do Google Places
      pharmacyName:    [this.pharmacyValue?.name    ?? null],
      pharmacyAddress: [this.pharmacyValue?.address ?? null],
      pharmacyPlaceId: [this.pharmacyValue?.placeId ?? null],
      pharmacyLat:     [this.pharmacyValue?.lat     ?? null],
      pharmacyLng:     [this.pharmacyValue?.lng     ?? null],
      pharmacyIconUrl:             [this.pharmacyValue?.iconUrl             ?? null],
      pharmacyIconBackgroundColor: [this.pharmacyValue?.iconBackgroundColor ?? null],
    });

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

    if (this.isEditMode && this.data?.medicamento) {
      this.aplicarResultadoBusca(this.data.medicamento);
    }
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

  salvar() {
    if (this.form.valid) {
      this.loading.set(true);
      const { ean, nomeVisual, tipoProduto, substancia, laboratorio, apresentacao, pmcZero, precoFabrica, medicationId, dataCompra, ...rest } = this.form.value;
      const dataCompraIso  = dataCompra ? new Date(dataCompra + 'T12:00:00').toISOString() : null;
      const payload = { ...rest, purchaseDate: dataCompraIso };

      if (this.isEditMode) {
        this.farmaciaService.atualizarVinculo(this.data.id, payload).subscribe({
          next: () => this.dialogRef.close(true),
          error: () => this.loading.set(false)
        });
      } else {
        this.farmaciaService.vincularRemedio({ medicationId, ...payload }).subscribe({
          next: () => this.dialogRef.close(true),
          error: () => this.loading.set(false)
        });
      }
    }
  }
}
