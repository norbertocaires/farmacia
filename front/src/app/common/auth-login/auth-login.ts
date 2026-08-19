import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { computed, inject, Injectable, signal } from '@angular/core';
import { UserRole } from '../../pages/user-admin/dto/User';
import { SocialAuthService } from '@abacritt/angularx-social-login';

// Interface espelhando o que o seu NestJS (Postinho Auth) envia
export interface User {
  id: number;
  name: string;
  email: string;
  role: string
}

interface LoginResponse {
  access_token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthLogin {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;
  private socialAuth = inject(SocialAuthService, { optional: true });

  // Signal principal: a fonte da verdade para o Front-end
  private userSignal = signal<User | null>(this.getUserFromStorage());
  private photoUrlSignal = signal<string | null>(localStorage.getItem('user_photo'));

  userPhoto = computed(() => this.photoUrlSignal());

  // Computeds para performance (não reprocessam se o valor for o mesmo)
  isLoggedIn = computed(() => !!this.userSignal());
  currentUser = computed(() => this.userSignal());
  userName = computed(() => this.userSignal()?.name || 'Usuário');
  userRole = computed(() => this.userSignal()?.role?.toUpperCase() ?? '');
  isAdmin = computed(() => [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(this.userRole() as UserRole));
  isFarmacia = computed(() => this.userRole() === UserRole.FARMACIA);
  
  canSeeCatalog = computed(() => [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FARMACIA].includes(this.userRole() as UserRole));
  canSeeUserAdmin = computed(() => [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(this.userRole() as UserRole));
  canSeeLogs = computed(() => [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(this.userRole() as UserRole));
  canSeeImport = computed(() => [UserRole.SUPER_ADMIN].includes(this.userRole() as UserRole));

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials).pipe(
      tap((res: LoginResponse) => this.setSession(res))
    );
  }

  googleLogin(idToken: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/google`, { idToken }).pipe(
      tap((res: LoginResponse) => this.setSession(res))
    );
  }

  /**
   * Use este método quando o usuário editar o perfil.
   * O backend de perfil só devolve um novo access_token, então mescla os
   * campos alterados com o usuário já em sessão em vez de substituí-lo
   * (substituir apagaria name/email/role quando `user` não vem na resposta).
   */
  updateUserData(newData: { access_token: string; user?: Partial<User> }): void {
    const currentUser = this.userSignal();
    const mergedUser = { ...currentUser, ...newData.user } as User;
    this.setSession({ access_token: newData.access_token, user: mergedUser });
  }

  setPhotoUrl(url: string | null) {
    if (url) {
      localStorage.setItem('user_photo', url);
    } else {
      localStorage.removeItem('user_photo');
    }
    this.photoUrlSignal.set(url);
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_photo');
    this.userSignal.set(null);
    this.photoUrlSignal.set(null);
    this.socialAuth?.signOut().catch(() => {});
  }

  // Centraliza a lógica de salvar para evitar repetição
  private setSession(authData: LoginResponse): void {
    localStorage.setItem('access_token', authData.access_token);
    localStorage.setItem('user_data', JSON.stringify(authData.user));
    this.userSignal.set({ ...authData.user });
  }

  private getUserFromStorage(): User | null {
    const userData = localStorage.getItem('user_data');
    if (!userData) return null;
    try {
      return JSON.parse(userData) as User;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
}