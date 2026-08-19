import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialogComponent } from './confirm-dialog';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render the overlay when not visible', async () => {
    component.visible = false;
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.modal-overlay')).toBeFalsy();
  });

  it('should emit confirmed when the confirm button is clicked', async () => {
    component.visible = true;
    await fixture.whenStable();

    const emitted: void[] = [];
    component.confirmed.subscribe(() => emitted.push(undefined));

    fixture.nativeElement.querySelector('.btn-danger').click();

    expect(emitted.length).toBe(1);
  });

  it('should emit cancelled when the overlay backdrop is clicked', async () => {
    component.visible = true;
    await fixture.whenStable();

    const emitted: void[] = [];
    component.cancelled.subscribe(() => emitted.push(undefined));

    fixture.nativeElement.querySelector('.modal-overlay').click();

    expect(emitted.length).toBe(1);
  });
});
