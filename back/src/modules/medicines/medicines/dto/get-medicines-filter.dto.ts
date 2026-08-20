import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetMedicinesFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100, { message: 'O limite máximo por página é 100.' })
  limit?: number;

  @IsOptional()
  @IsString()
  substancia?: string;

  @IsOptional()
  @IsString()
  laboratorio?: string;

  @IsOptional()
  @IsString()
  produto?: string;

  @IsOptional()
  @IsString()
  apresentacao?: string;

  @IsOptional()
  @IsString()
  ean?: string;

  @IsOptional()
  @IsString()
  registro?: string;

  @IsOptional()
  @IsString()
  tipoProduto?: string;
}