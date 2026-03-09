import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-mi-descriptivo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mi-descriptivo.html',
  styleUrl: './mi-descriptivo.css'
})
export class MiDescriptivo implements OnInit {

  cargando = true;
  empleado: any = null;
  descriptivo: any = null;
  procedimientos: any[] = [];
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const legajo = usuario.legajo;

    if (!legajo) {
      this.error = 'No se encontró tu legajo';
      this.cargando = false;
      return;
    }

    this.api.getEmpleado(legajo).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.ok) {
          this.empleado = res.data.empleado;
          this.descriptivo = res.data.descriptivo;
          this.procedimientos = res.data.procedimientos;
        } else {
          this.error = res.error;
        }
      },
      error: () => {
        this.cargando = false;
        this.error = 'Error al cargar tu información';
      }
    });
  }
}