import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { LogsComponent } from './logs.component';
import { LogsService } from './services/logs.service';
import { ActivityLog } from './dto/activity-log.dto';

describe('LogsComponent', () => {
  let component: LogsComponent;
  let fixture: ComponentFixture<LogsComponent>;
  let logsService: { findAll: ReturnType<typeof vi.fn>; findByEmail: ReturnType<typeof vi.fn> };

  const log = (overrides: Partial<ActivityLog>): ActivityLog => ({
    id: 1,
    action: 'CREATE',
    userId: 1,
    userEmail: 'maria@teste.com',
    description: 'Criou um registro',
    metadata: null,
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    location: null,
    createdAt: '2026-07-20T10:00:00.000Z',
    ...overrides,
  });

  beforeEach(async () => {
    logsService = {
      findAll: vi.fn(() => of({ data: [log({})], total: 1, page: 1, lastPage: 1 })),
      findByEmail: vi.fn(() => of([log({ id: 2 })])),
    };

    await TestBed.configureTestingModule({
      imports: [LogsComponent],
      providers: [{ provide: LogsService, useValue: logsService }],
    }).compileComponents();

    fixture = TestBed.createComponent(LogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load the first page of logs on init', () => {
    expect(component).toBeTruthy();
    expect(logsService.findAll).toHaveBeenCalledWith(1, 10);
    expect(component.logs.length).toBe(1);
    expect(component.totalLogs).toBe(1);
  });

  it('should search by email instead of paginating when a term is provided', () => {
    component.searchEmail = 'maria@teste.com';
    component.buscar();

    expect(logsService.findByEmail).toHaveBeenCalledWith('maria@teste.com');
    expect(component.isFiltrandoPorEmail).toBe(true);
    expect(component.logs[0].id).toBe(2);
  });

  it('should go back to the paginated list when the search is cleared', () => {
    component.searchEmail = 'maria@teste.com';
    component.buscar();
    logsService.findAll.mockClear();

    component.limparBusca();

    expect(component.searchEmail).toBe('');
    expect(logsService.findAll).toHaveBeenCalledWith(1, 10);
  });

  it('should clamp the page number to the valid range instead of ignoring it', () => {
    logsService.findAll.mockReturnValue(of({ data: [], total: 30, page: 1, lastPage: 3 }));
    component.totalPages = 3;
    component.page = 1;
    logsService.findAll.mockClear();

    component.changePage(0);
    expect(component.page).toBe(1);
    expect(logsService.findAll).toHaveBeenCalledWith(1, 10);

    logsService.findAll.mockClear();
    component.changePage(99);
    expect(component.page).toBe(3);
    expect(logsService.findAll).toHaveBeenCalledWith(3, 10);

    logsService.findAll.mockClear();
    component.changePage(2);
    expect(component.page).toBe(2);
    expect(logsService.findAll).toHaveBeenCalledWith(2, 10);
  });

  it('should allow expanding more than one log at the same time', () => {
    const first = log({ id: 10 });
    const second = log({ id: 11 });

    component.toggleDetalhes(first);
    component.toggleDetalhes(second);

    expect(component.expandedLogIds.has(10)).toBe(true);
    expect(component.expandedLogIds.has(11)).toBe(true);

    component.toggleDetalhes(first);
    expect(component.expandedLogIds.has(10)).toBe(false);
    expect(component.expandedLogIds.has(11)).toBe(true);
  });

  it('should classify actions into badge categories by keyword', () => {
    expect(component.actionClass('DELETE_USER')).toBe('danger');
    expect(component.actionClass('LOGIN')).toBe('info');
    expect(component.actionClass('CREATE_MEDICATION')).toBe('success');
    expect(component.actionClass('UPDATE_PROFILE')).toBe('warning');
    expect(component.actionClass('SOMETHING_ELSE')).toBe('default');
  });

  it('should format the location as city, region and country', () => {
    const withLocation = log({
      location: { city: 'Brasília', region: 'DF', country: 'BR', timezone: 'America/Sao_Paulo' },
    });

    expect(component.formatLocation(withLocation)).toBe('Brasília, DF, BR');
    expect(component.formatLocation(log({ location: null }))).toBe('');
  });

  it('should report whether a log has metadata', () => {
    expect(component.temMetadata(log({ metadata: { foo: 'bar' } }))).toBe(true);
    expect(component.temMetadata(log({ metadata: {} }))).toBe(false);
    expect(component.temMetadata(log({ metadata: null }))).toBe(false);
  });
});
