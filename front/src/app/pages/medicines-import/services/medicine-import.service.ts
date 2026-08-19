import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { environment } from '@env/environment'

@Injectable({ providedIn: 'root' })
export class MedicineImportService {
  private http = inject(HttpClient);

  importExcel(formData: FormData) {
    return this.http.post( `${environment.apiUrl}/medicines/import`, formData);
  }
}