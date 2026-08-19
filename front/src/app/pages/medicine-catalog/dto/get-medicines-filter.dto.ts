export class GetMedicinesFilterDto {
  page: number = 1;
  limit: number = 15;
  produto?: string;
  substancia?: string;
  laboratorio?: string;
  apresentacao?: string;
  tipoProduto?: string;
  ean?: string;
  registro?: string;
}