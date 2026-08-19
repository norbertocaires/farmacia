import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { SyncProgressComponent } from './sync-progress.component';
import { SyncService } from '../../common/socket-io/services/sync.service';

describe('SyncProgressComponent', () => {
  let component: SyncProgressComponent;
  let fixture: ComponentFixture<SyncProgressComponent>;
  let progress$: BehaviorSubject<{ percent: number; current: number; total: number } | null>;
  let resetMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.useFakeTimers();
    progress$ = new BehaviorSubject<{ percent: number; current: number; total: number } | null>(null);
    resetMock = vi.fn();

    const fakeSyncService = {
      getProgress: () => progress$.asObservable(),
      getMsg: () => new BehaviorSubject<string | null>(null).asObservable(),
      reset: resetMock,
    };

    await TestBed.configureTestingModule({
      imports: [SyncProgressComponent],
      providers: [{ provide: SyncService, useValue: fakeSyncService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SyncProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should only show the bar while progress is between 0 and 100', () => {
    const values: boolean[] = [];
    component.showBar$.subscribe(v => values.push(v));

    progress$.next({ percent: 0, current: 0, total: 10 });
    progress$.next({ percent: 50, current: 5, total: 10 });
    progress$.next({ percent: 100, current: 10, total: 10 });

    expect(values).toEqual([false, false, true, false]);
  });

  it('should start a 10s countdown and reset the sync once it finishes', () => {
    progress$.next({ percent: 100, current: 10, total: 10 });
    expect(component.countdown()).toBe(10);

    vi.advanceTimersByTime(9000);
    expect(component.countdown()).toBe(1);
    expect(resetMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(resetMock).toHaveBeenCalled();
    expect(component.countdown()).toBeNull();
  });

  it('should clear the countdown when progress goes back to null', () => {
    progress$.next({ percent: 100, current: 10, total: 10 });
    expect(component.countdown()).toBe(10);

    progress$.next(null);
    expect(component.countdown()).toBeNull();
  });
});
