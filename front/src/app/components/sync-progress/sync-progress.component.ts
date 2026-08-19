import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { SyncService } from '../../common/socket-io/services/sync.service';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { AsyncPipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-sync-progress',
  imports: [AsyncPipe, DecimalPipe],
  templateUrl: './sync-progress.component.html',
  styleUrls: ['./sync-progress.component.scss']
})
export class SyncProgressComponent implements OnInit, OnDestroy {
  progress$!: Observable<any>;
  message$!: Observable<string | null>;
  showBar$!: Observable<boolean>;

  countdown = signal<number | null>(null);

  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private progressSub!: Subscription;

  constructor(private syncService: SyncService) {}

  ngOnInit() {
    this.progress$ = this.syncService.getProgress();
    this.message$ = this.syncService.getMsg();

    this.showBar$ = this.progress$.pipe(
      map(p => p !== null && p.percent > 0 && p.percent < 100)
    );

    this.progressSub = this.progress$.subscribe(p => {
      if (p?.percent === 100 && this.countdownInterval === null) {
        this.startCountdown(10);
      } else if (p === null) {
        this.clearCountdown();
      }
    });
  }

  private startCountdown(seconds: number) {
    this.countdown.set(seconds);

    this.countdownInterval = setInterval(() => {
      const current = this.countdown()!;
      if (current <= 1) {
        this.clearCountdown();
        this.syncService.reset();
      } else {
        this.countdown.set(current - 1);
      }
    }, 1000);
  }

  private clearCountdown() {
    if (this.countdownInterval !== null) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.countdown.set(null);
  }

  ngOnDestroy() {
    this.progressSub?.unsubscribe();
    this.clearCountdown();
  }
}
