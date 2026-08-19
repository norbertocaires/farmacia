import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

// Exportamos um array com tudo que é comum
export const SHARED_IMPORTS = [
  CommonModule,
  RouterLink,
  RouterLinkActive,
  FormsModule,
  ReactiveFormsModule
];