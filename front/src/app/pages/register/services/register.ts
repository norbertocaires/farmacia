import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@env/environment'

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  register(userData: any): Observable<any> {
    // Chamando a rota que acabamos de criar no Nest
    return this.http.post(`${this.API_URL}/users/register`, userData);
  }
}