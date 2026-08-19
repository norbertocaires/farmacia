import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@env/environment'

export interface UserProfile {
  name: string;
  email: string;
}

export interface AccessToken{
  access_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly API_URL = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  /**
   * Busca um usuário específico pelo ID
   */
  getProfile(id: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_URL}/${id}`);
  }

  /**
   * Atualiza nome e/ou senha. O E-mail não é enviado pois é imutável.
   */
  updateProfile(email: string, data: { name?: string; password?: string }): Observable<AccessToken> {
    return this.http.patch<AccessToken>(`${this.API_URL}/${email}`, data);
  }

  /**
   * Busca lista de usuários com suporte a busca e paginação (usado no Swagger antes)
   */
  listUsers(page: number = 1, limit: number = 10, search?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get(`${this.API_URL}`, { params });
  }
}