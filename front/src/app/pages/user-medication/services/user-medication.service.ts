import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UserMedicationDto } from '../dto/user-medication.dto';

// Interface para o envio (Vínculo)
export interface LinkMedicationPayload {
  medicationId: string;
  pricePaid: number;
  boxQuantity: number;
  totalQuantity: number;
  dosage: number;
  frequencyPerDay: number;
  purchaseDate: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class FarmaciaService {
  private readonly API = `${environment.apiUrl}/meus-remedios`;

  constructor(private http: HttpClient) { }

  /**
   * Puxa o resumo financeiro e a lista de remédios do usuário.
   * Aquele que diz se ele "economizou" ou "pagou caro".
   */
  getResumo(): Observable<UserMedicationDto[]> {
    return this.http.get<UserMedicationDto[]>(`${this.API}/resumo`);
  }

  /**
   * Puxa o resumo financeiro e a lista de remédios do usuário por periodo.
   * Aquele que diz se ele "economizou" ou "pagou caro".
   */
  getResumoByPeriodo(inicio: string, fim: string): Observable<UserMedicationDto[]> {
    return this.http.get<UserMedicationDto[]>(`${this.API}/resumo/periodo?inicio=${inicio}&fim=${fim}`);
  }

  /**
   * Vincula um remédio do catálogo ao usuário logado.
   * O 'userId' o back-end pega direto do Token JWT.
   */
  vincularRemedio(payload: LinkMedicationPayload): Observable<any> {
    return this.http.post(`${this.API}/vincular`, payload);
  }

  /**
   * Busca um remédio no catálogo geral por EAN (Código de Barras)
   * Útil para o formulário de cadastro rápido.
   */
  // No seu farmacia.service.ts

  buscarPorNome(termo: string): Observable<any[]> {
    // Ajustado para passar o ?term= na URL
    return this.http.get<any[]>(`${environment.apiUrl}/medicines/search`, {
      params: { term: termo }
    });
  }

  /**
   * Remove um medicamento do "Postinho" do usuário
   * @param id O ID do vínculo (UserMedication)
   */
  getById(id: string | number): Observable<UserMedicationDto> {
    return this.http.get<UserMedicationDto>(`${this.API}/${id}`);
  }

  atualizarVinculo(id: string | number, payload: Omit<LinkMedicationPayload, 'medicationId'>): Observable<any> {
    return this.http.patch(`${this.API}/${id}`, payload);
  }

  excluirVinculo(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}