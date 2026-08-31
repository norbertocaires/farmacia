import { IsNumber, IsNotEmpty, IsUUID, Min, Max, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

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

  // Farmácia onde a compra foi feita — opcional, vem do seletor do Google
  // Places no front. Os 5 campos chegam juntos (ou nenhum deles).
  @IsOptional()
  @IsString()
  @MaxLength(255)
  pharmacyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  pharmacyAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  pharmacyPlaceId?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  pharmacyLat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  pharmacyLng?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  pharmacyIconUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  pharmacyIconBackgroundColor?: string;
}