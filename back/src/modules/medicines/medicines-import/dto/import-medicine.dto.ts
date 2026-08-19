export class ImportMedicineDto {
  substancia: string;
  laboratorio: string;
  produto: string; // Nome comercial
  apresentacao: string; 
  registro: string; // Número da ANVISA
  ean: string; // Código de barras
  
  // Variáveis para o motor de cálculo
  precoFabrica: number; // O valor "limpo" de 26,78
  listaTributaria: 'Positiva' | 'Negativa' | 'Neutra';
  
  // Opcional: Guardar o PMC 0% apenas para conferência rápida
  pmcZero: number; 
}