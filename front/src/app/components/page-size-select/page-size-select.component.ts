import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-page-size-select',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './page-size-select.component.html',
  styleUrl: './page-size-select.component.scss'
})
export class PageSizeSelectComponent {
  @Input() limit = 10;
  @Output() changed = new EventEmitter<number>();

  readonly options = [10, 20, 50, 100];

  onSelect(value: string) {
    this.changed.emit(Number(value));
  }
}
