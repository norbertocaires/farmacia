import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class UpdateRoleDto {
  @ApiProperty({ enum: Role, example: Role.FARMACIA })
  @IsNotEmpty({ message: 'A role é obrigatória.' })
  @IsEnum(Role, { message: 'Role inválida.' })
  role: Role;
}
