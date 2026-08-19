import { TestBed } from '@angular/core/testing';

import { SyncService, SOCKET_IO_FACTORY } from './sync.service';

describe('SyncService', () => {
  let service: SyncService;
  let handlers: Record<string, (payload: unknown) => void>;
  let ioMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    handlers = {};
    const fakeSocket = {
      on: vi.fn((event: string, cb: (payload: unknown) => void) => {
        handlers[event] = cb;
      }),
    };
    ioMock = vi.fn(() => fakeSocket);

    TestBed.configureTestingModule({
      providers: [{ provide: SOCKET_IO_FACTORY, useValue: ioMock }],
    });
    service = TestBed.inject(SyncService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and connect the socket once', () => {
    expect(service).toBeTruthy();
    expect(ioMock).toHaveBeenCalledTimes(1);
  });

  it('should send the current access token on every (re)connection attempt', () => {
    const options = ioMock.mock.calls[0][1];
    const authFn = options.auth as (cb: (data: object) => void) => void;

    localStorage.setItem('access_token', 'token-abc');
    let sent: any;
    authFn((data) => (sent = data));
    expect(sent).toEqual({ token: 'token-abc' });

    // Uma reconexão depois de trocar de usuário deve mandar o token atualizado, não o antigo.
    localStorage.setItem('access_token', 'token-xyz');
    authFn((data) => (sent = data));
    expect(sent).toEqual({ token: 'token-xyz' });
  });

  it('should push incoming sync_progress events to getProgress()', () => {
    const received: unknown[] = [];
    service.getProgress().subscribe((value) => received.push(value));

    handlers['sync_progress']({ percent: 50, current: 5, total: 10 });

    expect(received).toEqual([null, { percent: 50, current: 5, total: 10 }]);
  });

  it('should push incoming mensagem events to getMsg()', () => {
    const received: unknown[] = [];
    service.getMsg().subscribe((value) => received.push(value));

    handlers['mensagem']('Sincronização concluída');

    expect(received).toEqual([null, 'Sincronização concluída']);
  });

  it('should reset both progress and message to null', () => {
    handlers['sync_progress']({ percent: 100, current: 10, total: 10 });
    handlers['mensagem']('pronto');

    service.reset();

    const progress: unknown[] = [];
    const msg: unknown[] = [];
    service.getProgress().subscribe((value) => progress.push(value));
    service.getMsg().subscribe((value) => msg.push(value));

    expect(progress).toEqual([null]);
    expect(msg).toEqual([null]);
  });
});
