import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProfileService } from './services/profile';
import { ToastrService } from 'ngx-toastr';
import { AuthLogin } from '../../common/auth-login/auth-login'

@Component({
  selector: 'app-profile',
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  standalone: true, // Adicione se estiver usando componentes standalone
  imports: [ReactiveFormsModule] // Certifique-se de que o módulo de formulários está aqui
})
export class Profile implements OnInit {
  // 1. Injeções de Dependência modernas com inject()
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private toast = inject(ToastrService);
  private authLogin = inject(AuthLogin);

  profileForm: FormGroup; 

  constructor() {
    // 2. O construtor agora só inicializa o formulário, sem parâmetros
    this.profileForm = this.fb.group({
      email: [{ value: '', disabled: true }], 
      name: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.minLength(6)]] 
    });
  }

  ngOnInit(): void {
    var user = this.authLogin.currentUser();
    this.profileForm.patchValue({
      email: user?.email,
      name: user?.name
    });
  }

  save() {
    if (this.profileForm.valid) {
      const updateData = this.profileForm.getRawValue(); 
      
      if (!updateData.password) {
        delete updateData.password;
      }

      if(!updateData.email){
        this.toast.warning('Email não encontrado!')
        return;
      }

      this.profileService.updateProfile(updateData.email, updateData).subscribe({
        next: (res) => {
          this.authLogin.updateUserData({ access_token: res.access_token, user: { name: updateData.name } });
          this.toast.success('Perfil atualizado com sucesso!', 'Sucesso');
          this.profileForm.get('password')?.reset();
        },
        error: (err) => this.toast.error(err.error?.message || 'Erro ao atualizar', 'Erro')
      });
    }
  }
}