import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent {
  usuario = '';
  password = '';
  error = '';
  cargando = false;

  constructor(private router: Router, private api: ApiService) {}

  ingresar() {
    if (!this.usuario || !this.password) {
      this.error = 'Completá usuario y contraseña';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.api.login(this.usuario, this.password).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.ok) {
          localStorage.setItem('rol', res.data.rol);
          localStorage.setItem('usuario', JSON.stringify(res.data));
          this.router.navigate(['/dashboard']);
        } else {
          this.error = res.error;
        }
      },
      error: () => {
        this.cargando = false;
        this.error = 'Error de conexión. Intentá de nuevo.';
      }
    });
  }

  loginRapido(rol: string) {
    const demos: any = {
      admin:    { usuario: 'admin',    password: 'admin' },
      rrhh:     { usuario: 'rrhh',     password: 'rrhh' },
      empleado: { usuario: 'empleado', password: 'empleado' }
    };
    this.usuario = demos[rol].usuario;
    this.password = demos[rol].password;
    this.ingresar();
  }
}