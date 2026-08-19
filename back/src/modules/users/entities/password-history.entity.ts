import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('password_histories')
export class PasswordHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  passwordHash: string; // A senha já criptografada com bcrypt

  @CreateDateColumn()
  createdAt: Date; // Quando essa senha foi criada

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;
}