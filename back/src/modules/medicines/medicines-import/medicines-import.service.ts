import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Medicine } from '../entities/medicine.entity';
import { ImportMedicineDto } from './dto/import-medicine.dto';
import * as ExcelJS from 'exceljs';

import { SyncGateway } from '../../../common/socket-io/sync.gateway';
import { Readable } from 'stream';
import { promises as fs } from 'fs';
import { LogsService } from '../../log/logs.service';
import { LogAction } from '../../log/enums/log-action.enum';
import { RequestInfo } from '../../../common/utils/request-info.util';

@Injectable()
export class MedicinesImportService {
  constructor(
    @InjectRepository(Medicine)
    private readonly repository: Repository<Medicine>,
    private readonly syncGateway: SyncGateway,
    private readonly logsService: LogsService,
  ) { }

  async processExcel(filePath: string, actorEmail?: string, requestInfo?: RequestInfo): Promise<void> {

    this.syncGateway.sendMsg("📦 Abrindo arquivo e preparando sincronização...");
    this.syncGateway.sendProgress({
      percent: 1, // Começa com 1% para a barra ganhar um "tamaninho" visual
      current: 0,
      total: 0 // Ainda não sabemos o total, mas a barra já aparece
    });

    const startTime = performance.now();
    this.logMemory('Início do Stream');


    // 2. Usar o WorkbookReader (NÃO use o workbook.xlsx.read aqui)
    // O 'options: { entries: "emit" }' ajuda a evitar o erro FILE_ENDED em alguns contextos
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {});

    let totalProcessed = 0;
    let skipped = 0;
    let chunk: Medicine[] = [];
    const chunkSize = 500;
    const TOTAL_ESTIMADO = 25000;

    // A planilha da CMED tem um bloco de notas/legenda de tamanho variável antes
    // da tabela real; em vez de um número de linha fixo (frágil entre publicações),
    // localizamos a linha de cabeçalho pelo texto da primeira coluna.
    let headerFound = false;

    try {
      this.syncGateway.sendMsg("Iniciando leitura ultra-leve...");

      // O WorkbookReader funciona como um iterador assíncrono
      for await (const worksheetReader of workbookReader) {
        // Itera sobre as linhas da planilha atual
        for await (const row of (worksheetReader as any)) {

          if (!headerFound) {
            const primeiraCelula = row.getCell(1).text?.trim().toUpperCase();
            if (primeiraCelula === 'SUBSTÂNCIA' || primeiraCelula === 'SUBSTANCIA') {
              headerFound = true;
            }
            continue;
          }

          // No modo Stream, o mapeamento precisa ser cuidadoso com o tipo da row
          const dto = this.mapRowToMedicine(row);

          // "registro" é a coluna usada no ON CONFLICT do upsert (linha abaixo);
          // sem ela, linhas com registro em branco colidiriam entre si e uma
          // sobrescreveria os dados da outra silenciosamente.
          if (dto.ean && dto.registro) {
            chunk.push(dto);
            totalProcessed++;
          } else {
            skipped++;
          }

          // Quando o balde enche, salva no banco e esvazia
          if (chunk.length >= chunkSize) {
            await this.repository.upsert(this.dedupeByRegistro(chunk), ['registro']);

            // LIBERAÇÃO CRÍTICA DE MEMÓRIA
            chunk = [];

            this.notifyProgress(totalProcessed, TOTAL_ESTIMADO);
          }
        }
      }

      // Salva o que sobrou no último balde
      if (chunk.length > 0) {
        await this.repository.upsert(this.dedupeByRegistro(chunk), ['registro']);
      }

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      this.syncGateway.sendMsg(
        skipped > 0
          ? `✅ Sucesso! ${totalProcessed} itens em ${duration}s (${skipped} linhas ignoradas por falta de EAN/registro)`
          : `✅ Sucesso! ${totalProcessed} itens em ${duration}s`
      );

      this.syncGateway.sendProgress({
        percent: 100,
        current: totalProcessed, // O número real total
        total: totalProcessed    // Fazemos o total igualar ao processado para dar 100%
      });

      this.logMemory('Fim do Processamento (Stream)');

      await this.logsService.record(LogAction.MEDICINE_IMPORTED, {
        userEmail: actorEmail ?? 'sistema',
        description: `${actorEmail ?? 'sistema'} importou ${totalProcessed} medicamentos via planilha` +
          (skipped > 0 ? ` (${skipped} linhas ignoradas por falta de EAN/registro).` : '.'),
        metadata: { totalProcessado: totalProcessed, itensIgnorados: skipped, duracaoSegundos: Number(duration), status: 'sucesso' },
        requestInfo,
      });

    } catch (err) {
      console.error('❌ Erro no Stream:', err);
      // Os blocos já commitados (upsert por "registro") não são desfeitos — não há
      // transação envolvendo o import inteiro, de propósito, pra não segurar uma
      // conexão aberta por minutos num banco com pouca memória. Como o upsert é
      // idempotente, reenviar a mesma planilha completa é seguro: os itens já
      // salvos só são resalvos, e o restante é processado normalmente.
      this.syncGateway.sendMsg(`Erro ao ler arquivo após ${totalProcessed} itens salvos. Pode reenviar a planilha com segurança.`);

      await this.logsService.record(LogAction.MEDICINE_IMPORTED, {
        userEmail: actorEmail ?? 'sistema',
        description: `Importação de medicamentos por ${actorEmail ?? 'sistema'} falhou após ${totalProcessed} itens salvos (permanecem no catálogo). A planilha pode ser reenviada com segurança.`,
        metadata: { totalProcessado: totalProcessed, itensIgnorados: skipped, status: 'erro', erro: (err as Error)?.message },
        requestInfo,
      });
    } finally {
      // Força o Garbage Collector se o Node permitir
      if (global && typeof global.gc === 'function') {
        global.gc();
      }

      // O arquivo enviado (em /tmp) não serve pra mais nada depois do processamento;
      // sem isso ele fica pra sempre no disco a cada import.
      await fs.unlink(filePath).catch(err => {
        console.error('Erro ao remover arquivo temporário do import:', err);
      });
    }
  }






  // A CMED às vezes lista o mesmo "registro" mais de uma vez na planilha (variações
  // regionais de preço). Um único INSERT ... ON CONFLICT não aceita duas linhas com
  // o mesmo valor de conflito no mesmo comando — precisa dar erro "cannot affect row
  // a second time" senão. Mantemos a última ocorrência de cada registro no lote.
  private dedupeByRegistro(rows: Medicine[]): Medicine[] {
    const porRegistro = new Map<string, Medicine>();
    for (const row of rows) {
      porRegistro.set(row.registro, row);
    }
    return Array.from(porRegistro.values());
  }

  // Função auxiliar para monitorar a RAM no terminal do Render
  private logMemory(step: string) {
    const used = process.memoryUsage();
    const rss = (used.rss / 1024 / 1024).toFixed(2);
    const heapTotal = (used.heapTotal / 1024 / 1024).toFixed(2);
    const heapUsed = (used.heapUsed / 1024 / 1024).toFixed(2);

    console.log(`--- 🧠 MEMÓRIA [${step}] ---`);
    console.log(`RSS: ${rss}MB | Heap Total: ${heapTotal}MB | Heap Used: ${heapUsed}MB`);
    console.log('---------------------------');
  }


  // Função auxiliar para limpar o código principal
  private mapRowToMedicine(row: ExcelJS.Row): Medicine {
    const dto = new Medicine();
    dto.substancia = row.getCell(1).text?.trim() ?? '';
    dto.laboratorio = row.getCell(3).text?.trim() ?? '';
    dto.registro = row.getCell(5).text?.trim() ?? '';
    dto.ean = row.getCell(6).text?.trim() ?? '';
    dto.produto = row.getCell(9).text?.trim() ?? '';
    dto.apresentacao = row.getCell(10).text?.trim() ?? '';
    dto.tipoProduto = row.getCell(12).text?.trim() ?? '';
    dto.precoFabrica = this.parseBrazilianValue(row.getCell(14).value);
    dto.listaTributaria = this.normalizeLista(row.getCell(71).value?.toString());
    dto.pmcZero = this.parseBrazilianValue(row.getCell(41).value?.toString());
    return dto;
  }

  private notifyProgress(current: number, total: number) {
    const percent = Math.min(Math.round((current / total) * 100), 100);
    this.syncGateway.sendProgress({
      percent,
      current,
      total
    });
  }

  private parseBrazilianValue(value: any): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    const str = value.toString();

    const converted = str.replace(',', '.');
    const result = parseFloat(converted);

    return isNaN(result) ? 0 : result;
  }

  private normalizeLista(value: any): 'Positiva' | 'Negativa' | 'Neutra' {
    const text = value?.toString()?.trim()?.toUpperCase() || '';

    if (text.includes('POSITIVA')) return 'Positiva';
    if (text.includes('NEGATIVA')) return 'Negativa';

    // Se não for nenhuma das duas, a ANVISA trata como Neutra (sem crédito)
    return 'Neutra';
  }
}