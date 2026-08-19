// src/app/services/medicine.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@env/environment'
import { GetMedicinesFilterDto } from '../dto/get-medicines-filter.dto';

export interface Medicine {
  id?: number;
  name: string;
  manufacturer?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  lastPage: number;
}

@Injectable({ providedIn: 'root' })
export class MedicineCatalogService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/medicines`;

  // Cadastra no catálogo global
  create(medicine: Medicine): Observable<Medicine> {
    return this.http.post<Medicine>(this.API, medicine);
  }

  // Para o seu futuro Autocomplete
  search(term: string): Observable<Medicine[]> {
    return this.http.get<Medicine[]>(`${this.API}/search?term=${term}`);
  }

  getCatalog(filter: GetMedicinesFilterDto): Observable<PaginatedResult<any>> {
    return this.http.post<PaginatedResult<any>>(`${this.API}/findAll`, filter );
  }
}