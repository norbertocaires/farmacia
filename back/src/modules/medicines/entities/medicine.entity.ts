import { UserMedication } from "../../user-medication/entities/user-medication.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('medicines')
export class Medicine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  substancia: string;

  @Column()
  laboratorio: string;

  @Column()
  produto: string;

  @Column()
  apresentacao: string;

  @Column({ unique: true })
  registro: string;

  @Column()
  tipoProduto: string;

  @Column()
  ean: string;

  @Column({
    type: 'decimal',
    precision: 12, // Aumentamos para suportar valores altos
    scale: 2,      // Padronizamos para 2 casas decimais (moeda)
    transformer: { // Opcional: Garante que o TypeORM trate como número no JS
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    }
  })
  precoFabrica: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    }
  })
  pmcZero: number;

  @Column({
    type: 'simple-enum',
    enum: ['Positiva', 'Negativa', 'Neutra'],
    default: 'Neutra'
  })
  listaTributaria: string;

  // Relacionamento para saber quais "prescrições" usam este remédio
  @OneToMany(() => UserMedication, (userMedication) => userMedication.medication) // Note que aqui deve ser 'medication' (o nome do campo na outra entidade)
  userMedications: UserMedication[];
}