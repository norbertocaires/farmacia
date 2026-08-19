import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMedication } from './entities/user-medication.entity';
import { Medicine } from '../medicines/entities/medicine.entity';
import { LinkMedicationDto } from './dto/link-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { UsersService } from '../users/users.service';
import { LogsService } from '../log/logs.service';
import { LogAction } from '../log/enums/log-action.enum';
import { RequestInfo } from '../../common/utils/request-info.util';

@Injectable()
export class UserMedicationService {
  constructor(
    @InjectRepository(UserMedication)
    private userMedRepo: Repository<UserMedication>,
    @InjectRepository(Medicine)
    private medicineRepo: Repository<Medicine>,
    private usersService: UsersService,
    private logsService: LogsService,
  ) { }

  async vincularRemedio(email: string, dto: LinkMedicationDto, requestInfo?: RequestInfo) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    const medication = await this.medicineRepo.findOneBy({ id: dto.medicationId });
    if (!medication) {
      throw new NotFoundException('Medicamento não encontrado no catálogo.');
    }

    // Agora sim: todas as variáveis existem no 'dto'
    const link = this.userMedRepo.create({
      user: { id: user.id },
      medication: { id: dto.medicationId },
      pricePaid: dto.pricePaid,
      totalQuantity: dto.totalQuantity,
      dosage: dto.dosage,
      frequencyPerDay: dto.frequencyPerDay,
      boxQuantity: dto.boxQuantity,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
    });

    const savedLink = await this.userMedRepo.save(link);

    await this.logsService.record(LogAction.MEDICATION_LINKED, {
      userId: user.id,
      userEmail: user.email,
      description: `Usuário ${user.email} cadastrou um remédio.`,
      metadata: { medicationId: dto.medicationId, userMedicationId: savedLink.id },
      requestInfo,
    });

    return savedLink;
  }

  async getUserFinancesByEmail(email: string, busca?: string): Promise<any[]> {
    const vinculos = await this.buscarVinculos({ email, busca });
    return vinculos.map(item => this.mapVinculoParaResposta(item));
  }

  async getUserFinancesByEmailAndPeriod(email: string, inicio: string, fim: string, busca?: string): Promise<any[]> {
    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);

    if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
      throw new BadRequestException(`Datas inválidas. Use o formato AAAA-MM-DD. ${inicio} - ${fim}`);
    }

    // Se "fim" veio sem horário (ex: "2026-07-17"), o Date cai à meia-noite,
    // o que excluiria registros feitos ao longo do próprio dia. Estende até o fim do dia.
    if (/^\d{4}-\d{2}-\d{2}$/.test(fim)) {
      dataFim.setUTCHours(23, 59, 59, 999);
    }

    const vinculos = await this.buscarVinculos({ email, busca, inicio: dataInicio, fim: dataFim });
    return vinculos.map(item => this.mapVinculoParaResposta(item));
  }

  private async buscarVinculos(filtros: { email: string; busca?: string; inicio?: Date; fim?: Date }) {
    const query = this.userMedRepo.createQueryBuilder('vinculo')
      .leftJoinAndSelect('vinculo.medication', 'medication')
      .leftJoinAndSelect('vinculo.user', 'user')
      .where('user.email = :email', { email: filtros.email });

    if (filtros.busca) {
      query.andWhere('(LOWER(medication.produto) LIKE :busca OR LOWER(medication.substancia) LIKE :busca)', {
        busca: `%${filtros.busca.toLowerCase()}%`,
      });
    }

    if (filtros.inicio && filtros.fim) {
      query.andWhere('vinculo.purchaseDate BETWEEN :inicio AND :fim', {
        inicio: filtros.inicio,
        fim: filtros.fim,
      });
    }

    return query.getMany();
  }

  // Cálculo financeiro usado em toda listagem/detalhe de um vínculo — mantém a
  // fórmula (preço por caixa, gasto diário, comparação com o PMC) em um só lugar.
  //
  // "pricePaid" no retorno é sempre o valor bruto salvo no banco (o mesmo que
  // vincularRemedio/update esperam receber de volta) — nunca o valor derivado
  // "precoPorCaixa". Um front que reenvia o pricePaid do GET como body do PATCH
  // precisa continuar batendo com o que está salvo, senão qualquer edição (mesmo
  // em outro campo) corrompe o preço ao persistir o valor errado de volta.
  private calcularResumoFinanceiro(item: UserMedication) {
    const precoPago = Number(item.pricePaid);
    const precoPorCaixa = precoPago / item.boxQuantity;
    const custoPorDose = precoPorCaixa / item.totalQuantity;
    const gastoDiario = custoPorDose * Number(item.dosage) * item.frequencyPerDay;
    const pmc = Number(item.medication.pmcZero);

    return {
      pricePaid: precoPago,
      precoPorCaixa,
      gastoDiario,
      gastoMensalEstimado: gastoDiario * 30,
      economizou: precoPorCaixa <= pmc,
      diferencaPMC: Math.abs(pmc - precoPorCaixa),
      pmc,
    };
  }

  private mapVinculoParaResposta(item: UserMedication) {
    return {
      id: item.id,
      ean: item.medication.ean,
      nome: item.medication.produto,
      substancia: item.medication.substancia,
      totalQuantity: item.totalQuantity,
      dosage: Number(item.dosage),
      frequencyPerDay: item.frequencyPerDay,
      boxQuantity: item.boxQuantity,
      ...this.calcularResumoFinanceiro(item),
      dataCompra: item.purchaseDate ?? null,
      criadoEm: item.createdAt,
      atualizadoEm: item.updatedAt,
    };
  }

  async findOneByEmail(id: number, email: string) {
    const vinculo = await this.userMedRepo.findOne({
      where: { id, user: { email } },
      relations: ['medication', 'user'],
    });

    if (!vinculo) {
      throw new NotFoundException('Medicamento não encontrado no seu postinho');
    }

    return {
      ...this.mapVinculoParaResposta(vinculo),
      medicamento: vinculo.medication,
    };
  }

  async update(id: number, idUser: number, dto: UpdateMedicationDto, requestInfo?: RequestInfo) {
    const user = await this.usersService.findOne(idUser);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    const vinculo = await this.userMedRepo.findOne({
      where: {
        id,
        user: { id: Number(user.id) },
      },
    });

    if (!vinculo) {
      throw new NotFoundException('Medicamento não encontrado no seu postinho');
    }

    const { purchaseDate, ...rest } = dto;
    Object.assign(vinculo, rest);
    if (purchaseDate !== undefined) {
      vinculo.purchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    }
    const updated = await this.userMedRepo.save(vinculo);

    await this.logsService.record(LogAction.MEDICATION_UPDATED, {
      userId: user.id,
      userEmail: user.email,
      description: `Usuário ${user.email} editou um remédio cadastrado.`,
      metadata: { userMedicationId: id, alteracoes: dto },
      requestInfo,
    });

    return updated;
  }

  async remove(id: number, idUser: number, requestInfo?: RequestInfo) {
    const user = await this.usersService.findOne(idUser);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    const vinculo = await this.userMedRepo.findOne({
      where: {
        id,
        user: { id: Number(user.id) } // Força a conversão para número
      }
    });

    if (!vinculo) {
      throw new NotFoundException('Medicamento não encontrado no seu postinho');
    }

    const removed = await this.userMedRepo.remove(vinculo);

    await this.logsService.record(LogAction.MEDICATION_REMOVED, {
      userId: user.id,
      userEmail: user.email,
      description: `Usuário ${user.email} removeu um remédio cadastrado.`,
      metadata: { userMedicationId: id },
      requestInfo,
    });

    return removed;
  }
}