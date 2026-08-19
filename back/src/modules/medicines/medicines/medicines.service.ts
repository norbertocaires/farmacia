import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Medicine } from '../entities/medicine.entity';
import { GetMedicinesFilterDto } from './dto/get-medicines-filter.dto';

@Injectable()
export class MedicinesService {
  constructor(
    @InjectRepository(Medicine)
    private readonly repository: Repository<Medicine>,
  ) { }

  // O motor do seu Autocomplete no Angular
  async search(term: string) {
    if (!term) return [];

    const termo = `%${term.toLowerCase()}%`;

    return this.repository.find({
      where: [
        { ean: ILike(termo) },
      ],
      take: 1, // Limita para não sobrecarregar o front
      order: { produto: 'ASC' }
    });
  }

  // medicines.service.ts
  async findAll(params: GetMedicinesFilterDto) {

    const limit = Number(params.limit) || 15;
    const page = Number(params.page) || 1;
    const skip = (page - 1) * limit;

    const query = this.repository.createQueryBuilder('medicine');

    // Filtro Dinâmico: Só adiciona na Query o que vier preenchido no DTO
    if (params.produto) {
      query.andWhere('LOWER(medicine.produto) LIKE :produto', {
        produto: `%${params.produto.toLowerCase()}%`
      });
    }

    if (params.substancia) {
      query.andWhere('LOWER(medicine.substancia) LIKE :substancia', {
        substancia: `%${params.substancia.toLowerCase()}%`
      });
    }

    if (params.laboratorio) {
      query.andWhere('LOWER(medicine.laboratorio) LIKE :laboratorio', {
        laboratorio: `%${params.laboratorio.toLowerCase()}%`
      });
    }

    if (params.apresentacao) { // Usando o nome exatamente como no seu DTO
      query.andWhere('LOWER(medicine.apresentacao) LIKE :apresentacao', {
        apresentacao: `%${params.apresentacao.toLowerCase()}%`
      });
    }

    if (params.ean) {
      query.andWhere('medicine.ean LIKE :ean', {
        ean: `%${params.ean}%`
      });
    }

    if (params.registro) {
      query.andWhere('medicine.registro LIKE :registro', {
        registro: `%${params.registro}%`
      });
    }

    if (params.tipoProduto) {
      query.andWhere('medicine.tipoProduto LIKE :tipoProduto', {
        tipoProduto: `%${params.tipoProduto}%`
      });
    }

    // Execução com Paginação
    const [data, total] = await query
      .orderBy('medicine.substancia', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit),
    };
  }

}