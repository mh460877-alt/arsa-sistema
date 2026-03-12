import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-relevamiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relevamiento.html',
  styleUrl: './relevamiento.css'
})
export class Relevamiento implements OnInit {

  cargando = true;
  entrevistas: any[] = [];
  filtradas: any[] = [];
  busqueda = '';
  filtroEstado = '';
  mostrarForm = false;

  // Rol del usuario logueado
  rolUsuario = '';
  // Solo admin y rrhh ven campos privados
  get esPrivilegiado(): boolean {
    return this.rolUsuario === 'admin' || this.rolUsuario === 'rrhh';
  }

  nueva: any = {
    legajo: '',
    entrevistador: '',
    fecha: '',
    modalidad: 'Presencial',
    observaciones: '',
    // Nuevos campos V3
    link_sin_revision: '',
    link_definitivo: '',
    transcripcion: '',
    eneagrama: '',
    observacion_privada: ''
  };

  // Entrevista seleccionada para editar campos privados / links
  editando: any = null;
  mostrarEdicion = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    // Leer rol del usuario desde sessionStorage
    const raw = localStorage.getItem('usuario');
    if (raw) {
      const u = JSON.parse(raw);
      this.rolUsuario = (u.rol || '').toLowerCase();
    }
    if (this.rolUsuario === 'rrhh') {
      this.filtroEstado = 'COMPLETADO';
    }
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    this.api.leerTabla('Relevamiento').subscribe({
      next: (res: any) => {
        this.cargando = false;
        if (res.ok) {
          this.entrevistas = res.data.map((e: any) => ({
            ...e,
            fecha: e.fecha ? new Date(e.fecha).toLocaleDateString('es-AR') : ''
          }));
          this.filtrar();
        }
      },
      error: () => { this.cargando = false; }
    });
  }

  filtrar() {
    this.filtradas = this.entrevistas.filter((e: any) => {
      const b = !this.busqueda ||
        e.legajo?.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        e.entrevistador?.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        e.nombre?.toLowerCase().includes(this.busqueda.toLowerCase());
      const s = !this.filtroEstado || e.estado === this.filtroEstado;
      return b && s;
    });
  }

  guardar() {
    if (!this.nueva.legajo) { alert('Ingresá el legajo'); return; }
    this.api.post({ action: 'createEntrevista', data: this.nueva }).subscribe({
      next: (res: any) => {
        if (res.ok) {
          this.mostrarForm = false;
          this.resetNueva();
          this.cargar();
        } else {
          alert('Error: ' + res.error);
        }
      },
      error: (err: any) => { console.error('Error:', err); }
    });
  }

  // Abrir panel de edición de links y campos privados
  abrirEdicion(e: any) {
    this.editando = { ...e };
    this.mostrarEdicion = true;
  }

  cerrarEdicion() {
    this.editando = null;
    this.mostrarEdicion = false;
  }

  guardarEdicion() {
    if (!this.editando) return;
    this.api.post({ action: 'updateEntrevista', data: this.editando }).subscribe({
      next: (res: any) => {
        if (res.ok) {
          this.cerrarEdicion();
          this.cargar();
        } else {
          alert('Error: ' + res.error);
        }
      },
      error: () => { alert('Error de conexión'); }
    });
  }

  abrirLink(url: string) {
    if (url) window.open(url, '_blank');
  }

  resetNueva() {
    this.nueva = {
      legajo: '', entrevistador: '', fecha: '', modalidad: 'Presencial',
      observaciones: '', link_sin_revision: '', link_definitivo: '',
      transcripcion: '', eneagrama: '', observacion_privada: ''
    };
  }
}