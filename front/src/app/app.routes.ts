import { Routes } from '@angular/router';
import { RegisterComponent } from './pages/register/register';
import { LoginComponent } from './pages/login/login';
import { ListagemComponent } from './pages/user-medication/user-medication';
import { Profile } from './pages/profile/profile';
import { authGuard } from './auth-guard/auth-guard';
import { roleGuard } from './auth-guard/role-guard';

import { ImportMedicinesComponent } from './pages/medicines-import/medicines-import'
import { MedicineCatalogComponent } from './pages/medicine-catalog/medicine-catalog.component'
import { UserAdminComponent } from './pages/user-admin/user-admin.component';
import { LogsComponent } from './pages/logs/logs.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: ListagemComponent, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'medicineCatalog', component: MedicineCatalogComponent, canActivate: [authGuard, roleGuard(auth => auth.canSeeCatalog())] },
  { path: 'importMedicinesComponent', component: ImportMedicinesComponent, canActivate: [authGuard, roleGuard(auth => auth.canSeeImport())] },
  { path: 'useradmin', component: UserAdminComponent, canActivate: [authGuard, roleGuard(auth => auth.canSeeUserAdmin())] },
  { path: 'logs', component: LogsComponent, canActivate: [authGuard, roleGuard(auth => auth.canSeeLogs())] },


  { path: '**', redirectTo: 'login' }
];