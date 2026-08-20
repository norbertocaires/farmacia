// src/users/dto/find-users.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class FindUsersDto {
  @ApiPropertyOptional({ example: 'Usuario', description: 'Busca por nome ou email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100, { message: 'O limite máximo por página é 100.' })
  limit?: number;

  @ApiPropertyOptional({ example: true, description: 'Filtrar por usuários ativos (true) ou inativos (false). Omitir para retornar todos.' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
  isActive?: boolean;
}