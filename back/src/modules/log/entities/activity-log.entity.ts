import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { LogAction } from '../enums/log-action.enum';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ enum: LogAction, example: LogAction.USER_REGISTERED })
  @Index()
  @Column({ type: 'enum', enum: LogAction })
  action: LogAction;

  @ApiProperty({ example: 4, nullable: true })
  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @ApiProperty({ example: 'usuario@email.com' })
  @Index()
  @Column()
  userEmail: string;

  @ApiProperty({ example: 'Usuário cadastrou o remédio Dipirona 500mg' })
  @Column()
  description: string;

  @ApiProperty({ example: { medicationId: '...' }, nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ApiProperty({ example: '187.72.0.1', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  ipAddress: string | null;

  @ApiProperty({ example: 'Mozilla/5.0 (...)', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  userAgent: string | null;

  @ApiProperty({
    example: { city: 'São Paulo', region: 'SP', country: 'BR' },
    nullable: true,
  })
  @Column({ type: 'jsonb', nullable: true })
  location: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}
