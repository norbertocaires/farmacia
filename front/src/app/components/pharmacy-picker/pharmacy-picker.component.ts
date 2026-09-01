import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input,
  OnDestroy, OnInit, Output, ViewChild, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsLoaderService } from '../../common/google-maps/google-maps-loader.service';
import { PharmacyService } from '../../common/pharmacy/pharmacy.service';
import { PharmacySelection } from './pharmacy-selection';

// São Paulo como centro padrão quando a geolocalização não está disponível
// ou é negada — só um ponto de partida razoável pra começar a navegar.
const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: -23.5505, lng: -46.6333 };
const DEFAULT_ZOOM = 15;
const LOCATED_ZOOM = 17;

/**
 * Mapa interativo (sem campo de busca por texto) pra escolher a farmácia:
 * o usuário navega no próprio mapa (arrasta/zoom, como no Google Maps) e
 * clica em cima do ícone do estabelecimento — o clique num POI do mapa
 * dispara um evento com o placeId, que é resolvido via PlacesService pra
 * preencher nome/endereço/ícone reais daquele lugar (não um pino genérico).
 *
 * Mostra também as farmácias que o usuário já usou antes, pra reaproveitar
 * sem precisar navegar de novo — a mesma farmácia (mesmo placeId) nunca é
 * recadastrada no backend.
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

  @ViewChild('mapContainer') mapContainerRef!: ElementRef<HTMLDivElement>;

  readonly unavailable = signal(false);
  readonly loadError = signal(false);
  readonly selected = signal<PharmacySelection | null>(null);
  readonly recentes = signal<PharmacySelection[]>([]);
  readonly locating = signal(false);

  private map: google.maps.Map | null = null;
  private marker: google.maps.marker.AdvancedMarkerElement | null = null;
  private placesService: google.maps.places.PlacesService | null = null;
  private mapClickListener: google.maps.MapsEventListener | null = null;

  constructor(
    private mapsLoader: GoogleMapsLoaderService,
    private pharmacyService: PharmacyService,
  ) {}

  ngOnInit(): void {
    // Farmácias recentes não dependem do Maps carregado — é só uma consulta
    // ao nosso próprio backend, então mostra o quanto antes.
    this.pharmacyService.getMine().subscribe({
      next: (lista) => this.recentes.set(lista),
      error: () => this.recentes.set([]),
    });
  }

  ngAfterViewInit(): void {
    if (!this.mapsLoader.isConfigured) {
      this.unavailable.set(true);
      return;
    }

    this.selected.set(this.value);

    this.mapsLoader.load()
      .then(() => this.initMap())
      .catch(() => this.loadError.set(true));
  }

  ngOnDestroy(): void {
    if (this.mapClickListener) {
      google.maps.event.removeListener(this.mapClickListener);
    }
  }

  clear(): void {
    this.selected.set(null);
    if (this.marker) {
      this.marker.map = null;
    }
    this.marker = null;
    this.valueChange.emit(null);
  }

  selecionarRecente(place: PharmacySelection): void {
    this.selected.set(place);
    this.applySelection(place, true);
  }

  /** Centraliza o mapa na localização atual do navegador, se autorizado. */
  usarMinhaLocalizacao(): void {
    if (!this.map || !navigator.geolocation) return;
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.map!.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        this.map!.setZoom(LOCATED_ZOOM);
        this.locating.set(false);
      },
      () => this.locating.set(false),
      { timeout: 5000 }
    );
  }

  private async initMap(): Promise<void> {
    const jaSelecionado = this.value;
    const { center, zoom } = jaSelecionado
      ? { center: { lat: jaSelecionado.lat, lng: jaSelecionado.lng }, zoom: LOCATED_ZOOM }
      : await this.localizacaoInicial();

    this.map = new google.maps.Map(this.mapContainerRef.nativeElement, {
      center,
      zoom,
      disableDefaultUI: true,
      zoomControl: true,
      // AdvancedMarkerElement exige um mapId (não precisa ser um Map ID real
      // configurado no Cloud Console pra funcionar sem estilização na nuvem)
      // — "DEMO_MAP_ID" é o placeholder documentado pelo Google pra esse
      // exato caso. Também é o mapId que faz os ícones de estabelecimento
      // (POI) aparecerem clicáveis no mapa base.
      mapId: 'DEMO_MAP_ID',
    });

    // Clicar num ícone de estabelecimento do próprio mapa base é como o
    // usuário escolhe a farmácia — sem digitar nada. O Google dispara esse
    // mesmo evento "click" pra cliques em qualquer ponto do mapa, mas só
    // inclui `placeId` quando o clique caiu em cima de um POI.
    this.mapClickListener = this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
      const placeId = (event as google.maps.IconMouseEvent).placeId;
      if (!placeId) return;
      event.stop(); // evita a infowindow padrão do Google por cima do mapa
      this.resolverCliqueNoMapa(placeId);
    });

    if (jaSelecionado) {
      this.desenharPino(jaSelecionado);
    }
  }

  private resolverCliqueNoMapa(placeId: string): void {
    if (!this.placesService) {
      this.placesService = new google.maps.places.PlacesService(this.map!);
    }

    this.placesService.getDetails(
      { placeId, fields: ['place_id', 'name', 'formatted_address', 'geometry', 'icon', 'icon_background_color'] },
      (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) return;

        const selection: PharmacySelection = {
          name: place.name ?? '',
          address: place.formatted_address ?? '',
          placeId: place.place_id ?? placeId,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          iconUrl: place.icon ?? null,
          iconBackgroundColor: place.icon_background_color ?? null,
        };

        this.selected.set(selection);
        this.applySelection(selection, false);
      }
    );
  }

  private localizacaoInicial(): Promise<{ center: google.maps.LatLngLiteral; zoom: number }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ center: { lat: pos.coords.latitude, lng: pos.coords.longitude }, zoom: LOCATED_ZOOM }),
        () => resolve({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }),
        { timeout: 4000 }
      );
    });
  }

  private applySelection(place: PharmacySelection, recenter: boolean): void {
    this.valueChange.emit(place);
    this.desenharPino(place);

    if (recenter && this.map) {
      this.map.panTo({ lat: place.lat, lng: place.lng });
      this.map.setZoom(LOCATED_ZOOM);
    }
  }

  private desenharPino(place: PharmacySelection): void {
    if (!this.map) return;

    if (this.marker) {
      this.marker.map = null;
    }
    this.marker = new google.maps.marker.AdvancedMarkerElement({
      position: { lat: place.lat, lng: place.lng },
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
