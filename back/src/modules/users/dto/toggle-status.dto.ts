import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ToggleStatusDto {
  @ApiProperty({ example: true })
  @IsNotEmpty({ message: 'isActive é obrigatório.' })
  @IsBoolean({ message: 'isActive deve ser true ou false.' })
  isActive: boolean;
}
