import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { PharmacySelection } from '../../components/pharmacy-picker/pharmacy-selection';

interface PharmacyApiResponse {
  id: string;
  name: string;
  address: string | null;
  lat: string | number;
  lng: string | number;
  placeId: string;
  iconUrl: string | null;
  iconBackgroundColor: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PharmacyService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  // Farmácias já usadas pelo usuário logado em algum medicamento — pra
  // reaproveitar sem precisar buscar no Google de novo.
  getMine(): Observable<PharmacySelection[]> {
    return this.http.get<PharmacyApiResponse[]>(`${this.API_URL}/pharmacies/mine`).pipe(
      map((list) => list.map((p) => ({
        name: p.name,
        address: p.address ?? '',
        placeId: p.placeId,
        lat: Number(p.lat),
        lng: Number(p.lng),
        iconUrl: p.iconUrl,
        iconBackgroundColor: p.iconBackgroundColor,
      })))
    );
  }
}
