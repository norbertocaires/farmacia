import { environment } from '@env/environment'
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FindUsersDto } from '../dto/FindUsersDto';
import { UserRole } from '../dto/User';


@Injectable({
  providedIn: 'root'
})
export class UserAdminService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;


  findAll(search: FindUsersDto) {
    return this.http.post<any>(`${this.API_URL}/users/findAll`, search);
  }

  toggleStatus(email: string, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.API_URL}/users/${email}/status`, { isActive });
  }

  updateRole(email: string, role: UserRole): Observable<any> {
    return this.http.patch(`${this.API_URL}/users/${email}/role`, { role });
  }

  delete(email: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/users/${email}`);
  }
}