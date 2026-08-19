// src/app/services/sync.service.ts
import { Injectable, InjectionToken, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '@env/environment';

interface SyncProgress {
  percent: number;
  current: number;
  total: number;
}

// Indireção injetável para permitir substituir a conexão real por um fake nos testes.
export const SOCKET_IO_FACTORY = new InjectionToken<typeof io>('SOCKET_IO_FACTORY', {
  factory: () => io
});

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private socket: Socket;

  // Usamos BehaviorSubject para guardar o último estado do progresso
  private progressSubject = new BehaviorSubject<SyncProgress | null>(null);
  private msgSubject = new BehaviorSubject<string | null>(null);

  constructor() {
    const createSocket = inject(SOCKET_IO_FACTORY);

    // Conecta ao seu Back-end NestJS
    this.socket = createSocket(environment.socketUrl, {
      withCredentials: true,
      transports: ['websocket'], // Força o uso de WebSocket para ser mais rápido
      // Função (não objeto fixo) para que o token seja relido do localStorage a
      // cada tentativa de conexão/reconexão, e não fique preso ao valor do login inicial.
      auth: (cb) => cb({ token: localStorage.getItem('access_token') })
    });

    // Escuta o evento que definimos no NestJS
    this.socket.on('sync_progress', (data: SyncProgress) => {
      this.progressSubject.next(data);

    });

    this.socket.on('mensagem', (msg: string) => {
      this.msgSubject.next(msg);
    });

    this.socket.on('connect', () => console.log('Conectado ao MedGuard Sync'));
  }

  // Expõe o progresso como um Observable
  getProgress(): Observable<SyncProgress | null> {
    return this.progressSubject.asObservable();
  }

  getMsg(): Observable<string | null> {
    return this.msgSubject.asObservable();
  }

  reset() {
    this.progressSubject.next(null);
    this.msgSubject.next(null);
  }
}