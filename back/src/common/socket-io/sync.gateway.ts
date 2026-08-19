import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    // Busca do .env ou usa o localhost como fallback (Dev)
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Importante para o Render: Polling ajuda na negociação inicial se o WS demorar
  transports: ['websocket', 'polling'],
})
export class SyncGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('SyncGateway');

  constructor(private readonly jwtService: JwtService) { }

  afterInit(server: Server) {
    this.logger.log('🚀 Socket.io inicializado e aguardando conexões.');
  }

  handleConnection(client: Socket) {
    // Mesmo JWT usado no resto da API — o cliente manda em `auth.token`
    // (ou `?token=` como fallback) ao abrir a conexão.
    const token = (client.handshake.auth?.token || client.handshake.query?.token) as string | undefined;

    if (!token) {
      this.logger.warn(`Conexão recusada (sem token): ${client.id}`);
      client.disconnect(true);
      return;
    }

    try {
      this.jwtService.verify(token);
    } catch {
      this.logger.warn(`Conexão recusada (token inválido): ${client.id}`);
      client.disconnect(true);
      return;
    }

    this.logger.log(`🔌 Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`❌ Cliente desconectado: ${client.id}`);
  }

  /**
   * Envia o progresso da sincronização para todos os clientes
   */
  sendProgress(data: { percent: number; current: number; total: number }) {
    this.server.emit('sync_progress', data);
  }

  /**
   * Envia mensagens genéricas de log para o front
   */
  sendMsg(msg: string) {
    this.server.emit('mensagem', msg);
  }
}