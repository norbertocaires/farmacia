import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageSizeSelectComponent } from './page-size-select.component';

describe('PageSizeSelectComponent', () => {
  let component: PageSizeSelectComponent;
  let fixture: ComponentFixture<PageSizeSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageSizeSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PageSizeSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should offer 10/20/50/100 as options', () => {
    expect(component.options).toEqual([10, 20, 50, 100]);
  });

  it('should default to a limit of 10', () => {
    expect(component.limit).toBe(10);
  });

  it('should emit the chosen limit as a number', () => {
    const emitted: number[] = [];
    component.changed.subscribe((v: number) => emitted.push(v));

    component.onSelect('50');

    expect(emitted).toEqual([50]);
  });

  it('should render one option per entry in the options list', () => {
    const optionEls: HTMLOptionElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('option'),
    );

    expect(optionEls.map((o) => o.textContent?.trim())).toEqual(['10', '20', '50', '100']);
  });
});
