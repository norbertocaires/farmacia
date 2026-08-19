// src/app/pages/user-medication/dto/user-medication.dto.ts
export interface MedicamentoDto {
  id: string | number;
  produto: string;
  ean?: string;
  tipoProduto?: string;
  substancia?: string;
  laboratorio?: string;
  apresentacao?: string;
  pmcZero?: number;
  precoFabrica?: number;
}

export interface UserMedicationDto {
  id: number;
  nome: string;
  substancia: string;
  ean: string;
  gastoDiario: string;
  gastoMensalEstimado: string;
  economizou: boolean;
  diferencaPMC: string;
  isDeleting: boolean;
  criadoEm: Date;
  dataCompra: string | null;
  // campos retornados no GET :id
  pricePaid?: number;
  boxQuantity?: number;
  totalQuantity?: number;
  dosage?: number;
  frequencyPerDay?: number;
  pmc: number;
  medicamento?: MedicamentoDto;
}