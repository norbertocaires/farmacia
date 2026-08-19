import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalPermissoesComponent } from './modal-permissoes.component';
import { User, UserRole } from '../../pages/user-admin/dto/User';

describe('ModalPermissoesComponent', () => {
  let component: ModalPermissoesComponent;
  let fixture: ComponentFixture<ModalPermissoesComponent>;

  const user: User = { id: 1, name: 'Maria', email: 'maria@teste.com', role: UserRole.USUARIO, isActive: true };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalPermissoesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalPermissoesComponent);
    component = fixture.componentInstance;
    component.user = user;
    component.ngOnChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should preselect the role currently assigned to the user', () => {
    expect(component.selectedRole).toBe(UserRole.USUARIO);
  });

  it('should emit closed when the close button is clicked', () => {
    const emitted: void[] = [];
    component.closed.subscribe(() => emitted.push(undefined));

    fixture.nativeElement.querySelector('.modal-close').click();

    expect(emitted.length).toBe(1);
  });

  it('should emit confirmed with the selected role when saving', () => {
    const emitted: UserRole[] = [];
    component.confirmed.subscribe((role: UserRole) => emitted.push(role));

    const radios: HTMLInputElement[] = Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"]'));
    expect(radios.length).toBe(3);
    const adminRadio = radios[2];
    adminRadio.click();
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.btn-save').click();

    expect(emitted).toEqual([UserRole.ADMIN]);
  });
});
