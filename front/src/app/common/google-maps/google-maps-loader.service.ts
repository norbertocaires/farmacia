import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

/**
 * Carrega a Google Maps JavaScript API (com a lib "places") sob demanda —
 * só quando um componente que realmente precisa dela (o seletor de farmácia)
 * é usado, em vez de toda página da aplicação pagar o custo desse script.
 *
 * Sem GOOGLE_MAPS_API_KEY configurada, `load()` rejeita e quem chamar deve
 * degradar graciosamente (esconder o recurso, não quebrar o formulário).
 */
@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private loadPromise: Promise<typeof google> | null = null;

  get isConfigured(): boolean {
    return !!environment.googleMapsApiKey;
  }

  load(): Promise<typeof google> {
    if (!this.isConfigured) {
      return Promise.reject(new Error('GOOGLE_MAPS_API_KEY não configurada.'));
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    if (typeof google !== 'undefined' && google.maps?.places && google.maps?.marker) {
      this.loadPromise = Promise.resolve(google);
      return this.loadPromise;
    }

    this.loadPromise = new Promise<typeof google>((resolve, reject) => {
      const callbackName = '__googleMapsLoaded__';
      (window as any)[callbackName] = () => {
        delete (window as any)[callbackName];
        resolve(google);
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(environment.googleMapsApiKey)}&libraries=places,marker&callback=${callbackName}&loading=async`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        this.loadPromise = null;
        reject(new Error('Falha ao carregar a API do Google Maps.'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }
}
