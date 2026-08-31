import { IsNumber, IsOptional, Min, Max, IsDateString, IsString, MaxLength } from 'class-validator';

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
