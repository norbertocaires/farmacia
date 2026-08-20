// Os valores precisam ser IDÊNTICOS ao enum Role do back
// (back/src/common/enums/role.enum.ts) — é a forma como fica salvo no banco
// e é o que o back valida/retorna. Nada de normalizar caixa no front.
export enum UserRole {
    SUPER_ADMIN = 'SuperAdmin',
    ADMIN = 'admin',
    FARMACIA = 'farmacia',
    USUARIO = 'usuario'
}

export class User {
    id?: number;
    name?: string;
    email?: string;
    role?: UserRole;
    isActive?: boolean;
    createdAt?: string;
}