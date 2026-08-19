import { IsNumber, IsNotEmpty, IsUUID, Min, IsDateString, IsOptional } from 'class-validator';

export class LinkMedicationDto {
  @IsUUID()
  @IsNotEmpty()
  medicationId: string; // ID do remédio (UUID)

  @IsNumber()
  @Min(0.01)
  pricePaid: number; // Preço pago na caixa

  @IsNumber()
  @Min(1)
  totalQuantity: number; // Qtd comprimidos na caixa

  @IsNumber()
  @Min(0.1)
  dosage: number; // Dose por tomada

  @IsNumber()
  @Min(1)
  frequencyPerDay: number; // Vezes ao dia

  @IsNumber()
  @Min(1)
  boxQuantity: number; // Quantidade de caixas

  @IsOptional()
  @IsDateString()
  purchaseDate?: string; // Data da compra (ex: "2026-04-10")
}