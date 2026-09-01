import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input,
  OnDestroy, OnInit, Output, ViewChild, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsLoaderService } from '../../common/google-maps/google-maps-loader.service';
import { PharmacyService } from '../../common/pharmacy/pharmacy.service';
import { PharmacySelection } from './pharmacy-selection';

/**
 * Campo de busca (Google Places Autocomplete) + mapinha com o ÍCONE REAL do
 * Google pra aquele estabelecimento (não um pino genérico). Mostra também as
 * farmácias que o usuário já usou antes, pra reaproveitar sem buscar de novo
 * — a mesma farmácia (mesmo placeId) nunca é recadastrada no backend.
 *
 * Se a API key do Maps não estiver configurada, some silenciosamente — o
 * campo é sempre opcional, nunca bloqueia o formulário.
 */
@Component({
  selector: 'app-pharmacy-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pharmacy-picker.component.html',
  styleUrl: './pharmacy-picker.component.scss'
})
export class PharmacyPickerComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() value: PharmacySelection | null = null;
  @Output() valueChange = new EventEmitter<PharmacySelection | null>();

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('mapContainer') mapContainerRef!: ElementRef<HTMLDivElement>;

  readonly unavailable = signal(false);
  readonly loadError = signal(false);
  readonly selected = signal<PharmacySelection | null>(null);
  readonly recentes = signal<PharmacySelection[]>([]);

  private autocomplete: google.maps.places.Autocomplete | null = null;
  private map: google.maps.Map | null = null;
  private marker: google.maps.marker.AdvancedMarkerElement | null = null;
  private scrollRepositionPending = false;
  private readonly onAncestorScroll = () => this.notifyLayoutShift();

  constructor(
    private mapsLoader: GoogleMapsLoaderService,
    private pharmacyService: PharmacyService,
  ) {}

  ngOnInit(): void {
    // Farmácias recentes não dependem do Maps carregado — é só uma consulta
    // ao nosso próprio backend, então mostra o quanto antes.
    this.pharmacyService.getMine().subscribe({
      next: (lista) => { this.recentes.set(lista); this.notifyLayoutShift(); },
      error: () => this.recentes.set([]),
    });
  }

  /**
   * O widget legado google.maps.places.Autocomplete calcula a posição do seu
   * dropdown (`.pac-container`, injetado fora do Angular, direto no <body>)
   * a partir da posição do campo na tela, e só recalcula em eventos de
   * scroll/resize da JANELA — nunca em reflows arbitrários da página nem em
   * scroll de um container interno (ex.: o corpo do modal, que tem rolagem
   * própria). Duas situações comuns aqui deixam essa posição desatualizada:
   *
   *  1. A lista "Suas farmácias" chega de forma assíncrona e, ao renderizar,
   *     empurra o campo pra baixo — se o usuário já tiver começado a digitar
   *     antes dela chegar (rede real tem mais latência que localhost), o
   *     dropdown abre grudado na posição antiga.
   *  2. O modal tem rolagem interna; ao rolar até o campo de farmácia, esse
   *     scroll não é do `window`, então o Google nunca fica sabendo.
   *
   * Em ambos os casos, disparar um evento de `resize` sintético força o
   * widget a reler a posição atual do campo e reposicionar o dropdown.
   */
  private notifyLayoutShift(): void {
    if (this.scrollRepositionPending) return;
    this.scrollRepositionPending = true;
    requestAnimationFrame(() => {
      this.scrollRepositionPending = false;
      window.dispatchEvent(new Event('resize'));
    });
  }

  ngAfterViewInit(): void {
    // Eventos de scroll não voltam a subir (bubble), mas a fase de captura
    // passa por todo ancestral mesmo assim — isso pega o scroll do corpo do
    // modal (ou qualquer outro container rolável) sem precisar saber qual é.
    document.addEventListener('scroll', this.onAncestorScroll, { capture: true, passive: true });

    if (!this.mapsLoader.isConfigured) {
      this.unavailable.set(true);
      return;
    }

    this.selected.set(this.value);

    this.mapsLoader.load()
      .then(() => this.setupAutocomplete())
      .catch(() => this.loadError.set(true));
  }

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.onAncestorScroll, { capture: true });
    if (this.autocomplete) {
      google.maps.event.clearInstanceListeners(this.autocomplete);
    }
  }

  clear(): void {
    this.selected.set(null);
    if (this.searchInputRef) {
      this.searchInputRef.nativeElement.value = '';
    }
    if (this.marker) {
      this.marker.map = null;
    }
    this.marker = null;
    this.valueChange.emit(null);
  }

  selecionarRecente(place: PharmacySelection): void {
    this.selected.set(place);
    if (this.searchInputRef) {
      this.searchInputRef.nativeElement.value = place.name;
    }
    this.applySelection(place);
  }

  private setupAutocomplete(): void {
    const input = this.searchInputRef.nativeElement;

    this.autocomplete = new google.maps.places.Autocomplete(input, {
      types: ['establishment'],
      componentRestrictions: { country: 'br' },
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'icon', 'icon_background_color'],
    });

    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete!.getPlace();
      const location = place.geometry?.location;

      if (!place.place_id || !location) {
        // Usuário deu Enter sem escolher uma sugestão da lista — ignora.
        return;
      }

      const selection: PharmacySelection = {
        name: place.name ?? input.value,
        address: place.formatted_address ?? '',
        placeId: place.place_id,
        lat: location.lat(),
        lng: location.lng(),
        iconUrl: place.icon ?? null,
        iconBackgroundColor: place.icon_background_color ?? null,
      };

      this.selected.set(selection);
      this.applySelection(selection);
    });

    if (this.value) {
      input.value = this.value.name;
      this.applySelection(this.value);
    }
  }

  private applySelection(place: PharmacySelection): void {
    this.valueChange.emit(place);

    // O container do mapa some via CSS até aqui — dá um tick pro Angular
    // tirar a classe "hidden" antes de inicializar/redimensionar o mapa
    // (o Maps mede o elemento na hora da criação; se ainda estiver
    // display:none, ele nasce com tamanho zero).
    setTimeout(() => this.showOnMap(place), 0);
  }

  private showOnMap(place: PharmacySelection): void {
    const position = { lat: place.lat, lng: place.lng };

    if (!this.map) {
      this.map = new google.maps.Map(this.mapContainerRef.nativeElement, {
        center: position,
        zoom: 16,
        disableDefaultUI: true,
        zoomControl: true,
        // AdvancedMarkerElement exige um mapId (não precisa ser um Map ID
        // real configurado no Cloud Console pra funcionar sem estilização
        // na nuvem) — "DEMO_MAP_ID" é o placeholder documentado pelo Google
        // pra esse exato caso.
        mapId: 'DEMO_MAP_ID',
      });
    } else {
      // O container pode ter estado com display:none até agora — força o
      // Maps a remedir o elemento, senão o mapa fica com o tamanho antigo.
      google.maps.event.trigger(this.map, 'resize');
      this.map.setCenter(position);
    }

    if (this.marker) {
      this.marker.map = null;
    }
    this.marker = new google.maps.marker.AdvancedMarkerElement({
      position,
      map: this.map,
      content: this.buildPinElement(place),
      title: place.name,
    });
  }

  // Desenha o ícone REAL da categoria do lugar (o mesmo que o Google Maps
  // usa) dentro de um badge redondo — não um pino vermelho genérico.
  private buildPinElement(place: PharmacySelection): HTMLElement {
    const pin = document.createElement('div');
    pin.className = 'pharmacy-pin';
    pin.style.setProperty('--pin-bg', place.iconBackgroundColor || '#D4A857');

    if (place.iconUrl) {
      const img = document.createElement('img');
      img.src = place.iconUrl;
      img.alt = '';
      pin.appendChild(img);
    } else {
      pin.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
    }

    return pin;
  }
}
