import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-descriptivos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './descriptivos.html',
  styleUrl: './descriptivos.css'
})
export class Descriptivos implements OnInit {

  cargando = true;
  descriptivos: any[] = [];
  filtrados: any[] = [];
  busqueda = '';
  filtroEstado = '';
  seleccionado: any = null;
  editando = false;
  guardando = false;

  constructor(private api: ApiService) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando = true;
    this.api.leerTabla('Descriptivos').subscribe({
      next: (res: any) => {
        this.cargando = false;
        if (res.ok) {
          this.descriptivos = res.data;
          this.filtrar();
        }
      },
      error: () => { this.cargando = false; }
    });
  }

  filtrar() {
    this.filtrados = this.descriptivos.filter((d: any) => {
      const b = !this.busqueda ||
        d.familia_id?.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        d.familia_nombre?.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        d.puesto_nombre?.toLowerCase().includes(this.busqueda.toLowerCase());
      const s = !this.filtroEstado || d.estado === this.filtroEstado;
      return b && s;
    });
  }

  ver(d: any) {
    this.seleccionado = { ...d };
    this.editando = false;
  }

  cerrar() {
    this.seleccionado = null;
    this.editando = false;
  }

  guardar() {
    this.guardando = true;
    this.api.post({ action: 'saveDescriptivo', data: this.seleccionado }).subscribe({ error: () => {} });
    setTimeout(() => {
      this.guardando = false;
      this.editando = false;
      this.cargar();
    }, 2000);
  }

  publicar() {
    if (!this.seleccionado.link_doc) {
      alert('Debés subir el archivo antes de publicar.');
      return;
    }
    if (!confirm('¿Publicar este descriptivo? El empleado podrá verlo.')) return;
    this.api.post({ action: 'publicar', data: { familia_id: this.seleccionado.familia_id } }).subscribe({ error: () => {} });
    setTimeout(() => {
      this.seleccionado.estado = 'Publicado';
      this.seleccionado.publicado = 'SI';
      this.cargar();
    }, 2000);
  }

  nuevoDescriptivo() {
    this.seleccionado = {
      _esNuevo: true,
      familia_id: '',
      familia_nombre: '',
      puesto_nombre: '',
      sede_alcance: '',
      cant_empleados: '',
      categoria: '',
      estado: 'Borrador',
      mision: '',
      dependencia: '',
      publicado: 'NO',
      revisor_rrhh: '',
      procs_asignados: '',
      link_doc: ''
    };
    this.editando = true;
  }

  guardarNuevo() {
    if (!this.seleccionado.familia_id) { alert('Ingresá el Familia ID'); return; }
    this.guardando = true;
    this.api.post({ action: 'createDescriptivo', data: this.seleccionado }).subscribe({ error: () => {} });
    setTimeout(() => {
      this.guardando = false;
      this.seleccionado = null;
      this.cargar();
    }, 2000);
  }

  get totalPublicados() { return this.descriptivos.filter(d => d.publicado === 'SI').length; }
  get totalBorrador()   { return this.descriptivos.filter(d => !d.estado || d.estado === 'Borrador').length; }
  get totalRevision()   { return this.descriptivos.filter(d => d.estado === 'En revisión').length; }
}