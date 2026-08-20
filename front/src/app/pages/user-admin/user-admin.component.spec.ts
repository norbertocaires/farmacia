import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';

import { UserAdminComponent } from './user-admin.component';
import { UserAdminService } from './services/user-admin.servicer';
import { AuthLogin } from '../../common/auth-login/auth-login';
import { User, UserRole } from './dto/User';

describe('UserAdminComponent', () => {
  let component: UserAdminComponent;
  let fixture: ComponentFixture<UserAdminComponent>;
  let userAdminService: {
    findAll: ReturnType<typeof vi.fn>;
    toggleStatus: ReturnType<typeof vi.fn>;
    updateRole: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };

  const users: User[] = [
    { id: 1, name: 'Maria', email: 'maria@teste.com', role: UserRole.USUARIO, isActive: true },
    { id: 2, name: 'Eu Mesmo', email: 'admin@teste.com', role: UserRole.ADMIN, isActive: true },
  ];

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('user_data', JSON.stringify({ id: 2, name: 'Eu Mesmo', email: 'admin@teste.com', role: 'admin' }));

    userAdminService = {
      findAll: vi.fn(() => of({ data: users, total: 2, lastPage: 1 })),
      toggleStatus: vi.fn(() => of({})),
      updateRole: vi.fn(() => of({})),
      delete: vi.fn(() => of({})),
    };
    toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [UserAdminComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserAdminService, useValue: userAdminService },
        { provide: ToastrService, useValue: toast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create and load users on init', () => {
    expect(component).toBeTruthy();
    expect(userAdminService.findAll).toHaveBeenCalled();
    expect(component.users.length).toBe(2);
    expect(component.totalUsers).toBe(2);
  });

  it('should warn instead of toggling status for the current logged in user', () => {
    component.toggleStatus(users[1]);

    expect(toast.warning).toHaveBeenCalled();
    expect(userAdminService.toggleStatus).not.toHaveBeenCalled();
  });

  it('should toggle another user status', () => {
    component.toggleStatus(users[0]);

    expect(userAdminService.toggleStatus).toHaveBeenCalledWith('maria@teste.com', false);
    expect(users[0].isActive).toBe(false);
    expect(toast.success).toHaveBeenCalled();
  });

  it('should open the confirm dialog before deleting a user', () => {
    component.deletarUsuario(users[0]);

    expect(component.confirmDialog.visible).toBe(true);
    expect(component.confirmDialog.user).toBe(users[0]);
  });

  it('should delete the user and remove it from the list on confirm', () => {
    component.users = [...users];
    component.totalUsers = 2;
    component.deletarUsuario(users[0]);

    component.confirmarDeletar();

    expect(userAdminService.delete).toHaveBeenCalledWith('maria@teste.com');
    expect(component.users.find(u => u.id === 1)).toBeUndefined();
    expect(component.totalUsers).toBe(1);
    expect(component.confirmDialog.visible).toBe(false);
  });

  it('should save the new permission for the selected user', () => {
    component.abrirModalPermissoes(users[0]);
    expect(component.modalVisible).toBe(true);

    component.salvarPermissao(UserRole.FARMACIA);

    expect(userAdminService.updateRole).toHaveBeenCalledWith('maria@teste.com', UserRole.FARMACIA);
    expect(users[0].role).toBe(UserRole.FARMACIA);
    expect(component.modalVisible).toBe(false);
  });
});
