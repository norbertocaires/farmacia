import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

// Cadastro de farmácia, feito UMA vez (na primeira vez que alguém escolhe
// aquele lugar no Google Places) e reaproveitado por qualquer vínculo de
// medicamento depois — ver PharmacyService.findOrCreateByPlaceId.
@Entity('pharmacies')
export class Pharmacy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  placeId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lng: number;

  // Ícone da categoria do local, como o próprio Google Places devolve —
  // usado no front pra desenhar o pino real do estabelecimento, não um
  // pino genérico.
  @Column({ type: 'varchar', length: 500, nullable: true })
  iconUrl: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  iconBackgroundColor: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
