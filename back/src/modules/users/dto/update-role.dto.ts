import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

// SuperAdmin nunca é atribuível manualmente: só existe um, definido por
// ADMIN_EMAIL e controlado pelo DatabaseSeeder.
const ASSIGNABLE_ROLES = [Role.ADMIN, Role.FARMACIA, Role.USUARIO];

export class UpdateRoleDto {
  @ApiProperty({ enum: ASSIGNABLE_ROLES, example: Role.FARMACIA })
  @IsNotEmpty({ message: 'A role é obrigatória.' })
  @IsIn(ASSIGNABLE_ROLES, { message: 'Role inválida.' })
  role: Role;
}
