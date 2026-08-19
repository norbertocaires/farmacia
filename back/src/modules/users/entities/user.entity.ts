import { Entity, Column, PrimaryGeneratedColumn, OneToMany, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PasswordHistory } from './password-history.entity';
import { UserMedication } from '../../user-medication/entities/user-medication.entity';
import { Role } from '../../../common/enums/role.enum';

@Entity('users')
export class User {
  @ApiProperty({ example: 1, description: 'ID autoincremental' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'usuario@email.com' })
  @Index({ unique: true })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ example: 'Usuario Jr' })
  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ example: true, description: 'Usuário ativo/inativo' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ enum: Role, example: Role.USUARIO, description: 'Role do usuário' })
  @Column({ type: 'enum', enum: Role, default: Role.ADMIN })
  role: Role;

  @OneToMany(() => PasswordHistory, (history) => history.user)
  passwordHistories: PasswordHistory[];

  @ApiProperty({ type: () => UserMedication, isArray: true, description: 'Lista de remédios vinculados ao usuário' })
  @OneToMany(() => UserMedication, (userMedication) => userMedication.user)
  medications: UserMedication[];

}