import { IsNumber, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// Os dados de um place do Google Places, que chegam juntos do seletor no
// front. Reaproveitado tanto pelo LinkMedicationDto/UpdateMedicationDto
// quanto internamente pelo PharmacyService.
export class FindOrCreatePharmacyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  placeId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  iconUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  iconBackgroundColor?: string;
}
