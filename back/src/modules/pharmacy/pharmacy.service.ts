import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pharmacy } from './entities/pharmacy.entity';
import { UserMedication } from '../user-medication/entities/user-medication.entity';
import { FindOrCreatePharmacyDto } from './dto/find-or-create-pharmacy.dto';

@Injectable()
export class PharmacyService {
  constructor(
    @InjectRepository(Pharmacy)
    private pharmacyRepo: Repository<Pharmacy>,
    @InjectRepository(UserMedication)
    private userMedRepo: Repository<UserMedication>,
  ) { }

  // Cadastra a farmácia só na primeira vez que alguém escolhe esse place —
  // depois disso, todo mundo que escolher o MESMO lugar (mesmo placeId do
  // Google) reaproveita a mesma linha.
  async findOrCreateByPlaceId(dto: FindOrCreatePharmacyDto): Promise<Pharmacy> {
    const existing = await this.pharmacyRepo.findOneBy({ placeId: dto.placeId });
    if (existing) {
      return existing;
    }

    return this.pharmacyRepo.save(
      this.pharmacyRepo.create({
        placeId: dto.placeId,
        name: dto.name,
        address: dto.address ?? null,
        lat: dto.lat,
        lng: dto.lng,
        iconUrl: dto.iconUrl ?? null,
        iconBackgroundColor: dto.iconBackgroundColor ?? null,
      }),
    );
  }

  // Farmácias distintas que o usuário já usou em algum vínculo, mais
  // recente primeiro — alimenta o "suas farmácias" no seletor do front,
  // pra não precisar buscar no Google de novo pra um lugar repetido.
  //
  // Feito em duas etapas (busca os vínculos recentes já ordenados, deduplica
  // em JS) em vez de DISTINCT ON: no Postgres, DISTINCT ON força a ordenação
  // final da query a começar pela coluna do DISTINCT — não dava pra manter
  // "mais recente primeiro" na lista final só com SQL direto.
  async findRecentForUser(userId: number, limit = 8): Promise<Pharmacy[]> {
    const vinculos = await this.userMedRepo.find({
      where: { user: { id: userId } },
      relations: ['pharmacy'],
      order: { createdAt: 'DESC' },
      take: 50, // candidatos suficientes pra achar `limit` farmácias distintas
    });

    const vistas = new Set<string>();
    const farmacias: Pharmacy[] = [];

    for (const vinculo of vinculos) {
      if (!vinculo.pharmacy || vistas.has(vinculo.pharmacy.id)) continue;
      vistas.add(vinculo.pharmacy.id);
      farmacias.push(vinculo.pharmacy);
      if (farmacias.length >= limit) break;
    }

    return farmacias;
  }
}
