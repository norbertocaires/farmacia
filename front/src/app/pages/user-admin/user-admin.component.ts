import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { UserAdminService } from './services/user-admin.servicer';
import { FormsModule } from '@angular/forms';
import { FindUsersDto } from './dto/FindUsersDto';
import { User, UserRole } from './dto/User';
import { AuthLogin } from '../../common/auth-login/auth-login';
import { ModalPermissoesComponent } from '../../components/modal-permissoes/modal-permissoes.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';

@Component({
    selector: 'app-user-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalPermissoesComponent, ConfirmDialogComponent],
    templateUrl: './user-admin.component.html',
    styleUrl: './user-admin.component.scss'
})
export class UserAdminComponent implements OnInit {
    private userAdminService = inject(UserAdminService);
    private authLogin = inject(AuthLogin);
    private toast = inject(ToastrService);
    private cdr = inject(ChangeDetectorRef);

    users: User[] = [];
    loading = false;
    totalUsers = 0;
    totalPages = 1;

    search: FindUsersDto = {
        limit: 10,
        page: 1,
        search: undefined
    };

    // Confirm dialog deleção
    confirmDialog = { visible: false, user: null as User | null };

    // Modal de permissões
    modalVisible = false;
    modalUser: User | null = null;
    readonly UserRole = UserRole;
    modalRole: UserRole = UserRole.USUARIO;
    savingRole = false;

    get currentUserEmail() {
        return this.authLogin.currentUser()?.email;
    }

    get isAdmin() {
        return this.authLogin.isAdmin();
    }

    ngOnInit() {
        this.carregarUsuarios();
    }

    carregarUsuarios() {
        this.loading = true;
        this.cdr.markForCheck();

        this.userAdminService.findAll(this.search).subscribe({
            next: (res) => {
                this.users = res.data ?? res;
                this.totalUsers = res.total ?? this.users.length;
                this.totalPages = res.totalPages
                    ?? res.lastPage
                    ?? Math.ceil(this.totalUsers / this.search.limit);
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.toast.error('Erro ao carregar usuários');
                this.loading = false;
                this.cdr.markForCheck();
            }
        });
    }

    changePage(page: number) {
        // Trava dentro do intervalo válido em vez de ignorar — o input numérico de
        // página é editável livremente e pode chegar aqui com um valor fora do range.
        this.search.page = Math.min(Math.max(page, 1), this.totalPages);
        this.carregarUsuarios();
    }

    toggleStatus(user: User) {
        if (user.email === this.authLogin.currentUser()?.email) {
            this.toast.warning('Você não pode alterar o seu próprio status');
            return;
        }

        this.userAdminService.toggleStatus(user.email!, !user.isActive).subscribe({
            next: () => {
                user.isActive = !user.isActive;
                this.toast.success(`Usuário ${user.name} ${user.isActive ? 'ativado' : 'desativado'}`);
                this.cdr.markForCheck();
            },
            error: () => {
                this.toast.error('Erro ao alterar status do usuário');
            }
        });
    }

    abrirModalPermissoes(user: User) {
        this.modalUser = user;
        this.modalRole = user.role ?? UserRole.USUARIO;
        this.modalVisible = true;
        this.cdr.markForCheck();
    }

    fecharModal() {
        this.modalVisible = false;
        this.modalUser = null;
        this.cdr.markForCheck();
    }

    deletarUsuario(user: User) {
        this.confirmDialog = { visible: true, user };
        this.cdr.markForCheck();
    }

    confirmarDeletar() {
        const user = this.confirmDialog.user;
        this.confirmDialog = { visible: false, user: null };
        if (!user) return;

        this.userAdminService.delete(user.email!).subscribe({
            next: () => {
                this.users = this.users.filter(u => u.id !== user.id);
                this.totalUsers--;
                this.toast.success(`Usuário ${user.name} deletado com sucesso`);
                this.cdr.markForCheck();
            },
            error: () => {
                this.toast.error('Erro ao deletar usuário');
            }
        });
    }

    cancelarDeletar() {
        this.confirmDialog = { visible: false, user: null };
        this.cdr.markForCheck();
    }

    salvarPermissao(role: UserRole) {
        if (!this.modalUser) return;

        this.savingRole = true;
        this.cdr.markForCheck();

        this.userAdminService.updateRole(this.modalUser.email!, role).subscribe({
            next: () => {
                this.modalUser!.role = role;
                this.toast.success(`Permissão de ${this.modalUser!.name} atualizada para ${role}`);
                this.savingRole = false;
                this.fecharModal();
                this.cdr.markForCheck();
            },
            error: () => {
                this.toast.error('Erro ao atualizar permissão');
                this.savingRole = false;
                this.cdr.markForCheck();
            }
        });
    }
}
