export interface PharmacySelection {
  name: string;
  address: string;
  placeId: string;
  lat: number;
  lng: number;
  // Ícone de categoria do Google Places pra esse local — usado no mapa em
  // vez de um pino genérico. Ausente quando a farmácia veio de uma versão
  // antiga do backend, antes desses campos existirem.
  iconUrl?: string | null;
  iconBackgroundColor?: string | null;
}
