import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Ajuste o caminho conforme seu projeto
import { Medicine } from '../../medicines/entities/medicine.entity';
import { Pharmacy } from '../../pharmacy/entities/pharmacy.entity';

@Entity('user_medications')
export class UserMedication {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.medications)
  user: User;

  @ManyToOne(() => Medicine, (medicine) => medicine.userMedications)
  medication: Medicine; // Garante que o tipo aqui seja Medicine

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Preço pago na caixa' })
  pricePaid: number;

  @Column({ type: 'int', comment: 'Quantidade de comprimidos/ml na caixa' })
  totalQuantity: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, comment: 'Dose por tomada' })
  dosage: number;

  @Column({ type: 'int', comment: 'Vezes ao dia (ex: 3 para 8/8h)' })
  frequencyPerDay: number;

  @Column({ type: 'int', default: 1, comment: 'Quantidade de caixas' })
  boxQuantity: number;

  @Column({ type: 'timestamp', nullable: true, comment: 'Data da compra' })
  purchaseDate: Date | null;

  // Farmácia onde a compra foi feita — opcional, escolhida via Google Places
  // no front. É uma entidade própria (ver Pharmacy) porque a MESMA farmácia
  // é reaproveitada entre vários vínculos, cadastrada só na primeira vez
  // (ver PharmacyService.findOrCreateByPlaceId) — não duplica a cada compra.
  @ManyToOne(() => Pharmacy, { nullable: true, eager: false })
  pharmacy: Pharmacy | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Campo calculado que retorna o custo de cada comprimido/dose
  get costPerDose(): number {
    return this.pricePaid / this.totalQuantity;
  }

  // Gasto diário
  get dailyCost(): number {
    return this.costPerDose * this.dosage * this.frequencyPerDay;
  }
}