import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-procedimientos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './procedimientos.html',
  styleUrl: './procedimientos.css',
})
export class Procedimientos implements OnInit {

  cargando = true;
  procedimientos: any[] = [];
  filtrados: any[] = [];
  descriptivos: any[] = [];

  busqueda = '';
  filtroEstado = '';
  filtroTipo = '';

  seleccionado: any = null;
  editando = false;
  guardando = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    this.api.leerTabla('Procedimientos').subscribe({
      next: (res: any) => {
        if (res.ok) {
          this.procedimientos = res.data || [];
          this.filtrar();
        }
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
    this.api.leerTabla('Descriptivos').subscribe({
      next: (res: any) => {
        if (res.ok) this.descriptivos = res.data || [];
      },
      error: () => {}
    });
  }

  filtrar() {
    this.filtrados = this.procedimientos.filter((p: any) => {
      const b = !this.busqueda ||
        p.codigo?.toLowerCase().includes(this.busqueda.toLowerCase()) ||
        p.nombre?.toLowerCase().includes(this.busqueda.toLowerCase());
      const s = !this.filtroEstado || p.estado === this.filtroEstado;
      const t = !this.filtroTipo  || p.tipo   === this.filtroTipo;
      return b && s && t;
    });
  }

  get descriptivosVinculados(): any[] {
    if (!this.seleccionado?.codigo) return [];
    const codigo = this.seleccionado.codigo.toLowerCase().trim();
    return this.descriptivos.filter((d: any) => {
      if (!d.procs_asignados) return false;
      return d.procs_asignados
        .split(',')
        .map((c: string) => c.trim().toLowerCase())
        .includes(codigo);
    });
  }

  contarVinculados(codigo: string): string {
    if (!codigo) return '—';
    const c = codigo.toLowerCase().trim();
    const count = this.descriptivos.filter((d: any) => {
      if (!d.procs_asignados) return false;
      return d.procs_asignados
        .split(',')
        .map((x: string) => x.trim().toLowerCase())
        .includes(c);
    }).length;
    return count > 0 ? `${count} desc.` : '—';
  }

  ver(p: any) {
    this.seleccionado = { ...p };
    this.editando = false;
  }

  cerrar() {
    this.seleccionado = null;
    this.editando = false;
  }

  guardar() {
    this.guardando = true;
    this.api.post({ action: 'saveProcedimiento', data: this.seleccionado })
      .subscribe({ error: () => {} });
    setTimeout(() => {
      this.guardando = false;
      this.editando = false;
      this.cargar();
    }, 2000);
  }

  nuevoProcedimiento() {
    this.seleccionado = {
      _esNuevo: true,
      codigo: '',
      nombre: '',
      tipo: 'OP',
      version: '1.0',
      estado: 'Borrador',
      area_responsable: '',
      fecha_vigencia: '',
      fecha_revision: '',
      descripcion: '',
      pasos: '',
      observaciones: '',
      link_doc: '',
    };
    this.editando = true;
  }

  guardarNuevo() {
    if (!this.seleccionado.codigo) { alert('El código es obligatorio.'); return; }
    if (!this.seleccionado.nombre) { alert('El nombre es obligatorio.'); return; }
    this.guardando = true;
    this.api.post({ action: 'createProcedimiento', data: this.seleccionado })
      .subscribe({ error: () => {} });
    setTimeout(() => {
      this.guardando = false;
      this.seleccionado = null;
      this.cargar();
    }, 2000);
  }

  estadoClass(estado: string): string {
    const m: Record<string, string> = {
      'Vigente':     'est-vigente',
      'En revisión': 'est-revision',
      'Obsoleto':    'est-obsoleto',
      'Borrador':    'est-borrador',
    };
    return m[estado] || 'est-borrador';
  }

  tipoClass(tipo: string): string {
    const m: Record<string, string> = {
      'OP':  'tipo-op',
      'ADM': 'tipo-adm',
      'SEG': 'tipo-seg',
      'CAL': 'tipo-cal',
      'GEN': 'tipo-gen',
    };
    return m[tipo] || 'tipo-gen';
  }

  tipoLabel(tipo: string): string {
    const m: Record<string, string> = {
      'OP':  'Operativo',
      'ADM': 'Administrativo',
      'SEG': 'Seguridad',
      'CAL': 'Calidad',
      'GEN': 'General',
    };
    return m[tipo] || tipo || 'General';
  }

  get totalVigentes() { return this.procedimientos.filter(p => p.estado === 'Vigente').length; }
  get totalRevision() { return this.procedimientos.filter(p => p.estado === 'En revisión').length; }
  get totalBorrador() { return this.procedimientos.filter(p => !p.estado || p.estado === 'Borrador').length; }
  get totalObsoleto() { return this.procedimientos.filter(p => p.estado === 'Obsoleto').length; }
}