import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User, UserRole } from '../../pages/user-admin/dto/User';

@Component({
  selector: 'app-modal-permissoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-permissoes.component.html',
  styleUrl: './modal-permissoes.component.scss'
})
export class ModalPermissoesComponent {
  @Input() user!: User;
  @Input() saving = false;
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<UserRole>();

  selectedRole!: UserRole;
  readonly UserRole = UserRole;

  ngOnChanges() {
    this.selectedRole = this.user?.role ?? UserRole.USUARIO;
  }
}
