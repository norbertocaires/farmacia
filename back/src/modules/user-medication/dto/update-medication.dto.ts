import { IsNumber, IsOptional, Min, IsDateString } from 'class-validator';

export class UpdateMedicationDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  pricePaid?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  totalQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  dosage?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  frequencyPerDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  boxQuantity?: number;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;
}
