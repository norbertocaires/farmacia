import { BadRequestException, Controller, Post, UseGuards, UseInterceptors, UploadedFile, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { MedicinesImportService } from './medicines-import.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { extractRequestInfo } from '../../../common/utils/request-info.util';

const XLSX_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream', // alguns browsers/clientes não identificam o mimetype de .xlsx corretamente
];

@ApiTags('medicines')
@ApiBearerAuth()
@Controller('medicines')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicinesImportController {
  constructor(private readonly medicinesImportService: MedicinesImportService) { }

  @Post('import')
  @Roles(Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file', {
    dest: '/tmp',
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (_req, file, callback) => {
      const isXlsx = file.originalname.toLowerCase().endsWith('.xlsx') && XLSX_MIME_TYPES.includes(file.mimetype);
      callback(isXlsx ? null : new BadRequestException('Apenas arquivos .xlsx são aceitos.'), isXlsx);
    },
  }))
  async importExcel(@UploadedFile() file: Express.Multer.File, @Request() req: ExpressRequest & { user: { email: string } }) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    this.medicinesImportService.processExcel(file.path, req.user.email, extractRequestInfo(req)).catch(err => {
      console.error('Erro no processamento background:', err);
    });

    return {
      message: 'Processamento iniciado. Acompanhe o progresso pelo sistema.',
      status: 'processing'
    };
  }
}
