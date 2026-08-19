import { environment } from '@env/environment';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivityLog, PaginatedLogs } from '../dto/activity-log.dto';

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/logs`;

  findAll(page: number, limit: number): Observable<PaginatedLogs> {
    return this.http.get<PaginatedLogs>(this.API, { params: { page, limit } });
  }

  findByEmail(email: string): Observable<ActivityLog[]> {
    return this.http.get<ActivityLog[]>(`${this.API}/${encodeURIComponent(email)}`);
  }
}
