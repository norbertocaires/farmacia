export enum UserRole {
    SUPER_ADMIN = 'SUPERADMIN',
    ADMIN = 'ADMIN',
    FARMACIA = 'FARMACIA',
    USUARIO = 'USUARIO'
}

export class User {
    id?: number;
    name?: string;
    email?: string;
    role?: UserRole;
    isActive?: boolean;
    createdAt?: string;
}