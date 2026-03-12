import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ApiService } from '../../services/api';

export interface Empleado {
  codigo_arsa:     string;
  legajo:          string;
  apellido_nombre: string;
  sede:            string;
  puesto:          string;
  categoria:       string;
  estado_relev:    string;
}

const FAMILIAS = [
  { code: 'OPA',  name: 'Operaciones Agua' },
  { code: 'ADM',  name: 'Administración' },
  { code: 'AYC',  name: 'Operaciones A y C' },
  { code: 'EM',   name: 'Electromecánica / Mant.' },
  { code: 'OPC',  name: 'Operaciones Cloacas' },
  { code: 'TEC',  name: 'Técnica / Planta' },
  { code: 'JEF',  name: 'Jefatura de Servicio' },
  { code: 'CAP',  name: 'Capataz' },
  { code: 'COM',  name: 'Gestión Comercial' },
  { code: 'PROF', name: 'Profesional' },
  { code: 'GER',  name: 'Gerencia / Subgerencia' },
  { code: 'OTR',  name: 'Otros' },
  { code: 'PAS',  name: 'Pasantía' },
];

const SEDES = [
  { code: 'Bariloche',          name: 'Bariloche' },
  { code: 'Gral. Roca',         name: 'Gral. Roca' },
  { code: 'Viedma',             name: 'Viedma' },
  { code: 'Allen',              name: 'Allen' },
  { code: 'Catriel',            name: 'Catriel' },
  { code: 'Choele Choel',       name: 'Choele Choel' },
  { code: 'Cinco Saltos',       name: 'Cinco Saltos' },
  { code: 'Cipolletti',         name: 'Cipolletti' },
  { code: 'Fernández Oro',      name: 'Fernández Oro' },
  { code: 'Ing. Huergo',        name: 'Ing. Huergo' },
  { code: 'Río Colorado',       name: 'Río Colorado' },
  { code: 'S.A.O.',             name: 'S.A.O.' },
  { code: 'Gral. Conesa',       name: 'Gral. Conesa' },
  { code: 'Las Grutas',         name: 'Las Grutas' },
  { code: 'Sierra Grande',      name: 'Sierra Grande' },
  { code: 'Valcheta',           name: 'Valcheta' },
  { code: 'Villa Regina',       name: 'Villa Regina' },
  { code: 'El Bolsón',          name: 'El Bolsón' },
  { code: 'Viedma Central',     name: 'Viedma Central' },
];

@Component({
  selector: 'app-nomina',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nomina.html',
  styleUrl: './nomina.css'
})
export class Nomina implements OnInit, OnDestroy {

  // ── Signals ──────────────────────────────────────────────────────
  empleados       = signal<Empleado[]>([]);
  empleadosFiltrados = signal<Empleado[]>([]);
  cargando        = signal(false);
  errorMsg        = signal('');

  // ── Filtros ──────────────────────────────────────────────────────
  busqueda      = '';
  filtroSede    = '';
  filtroFamilia = '';
  filtroEstado  = '';

  // ── Dropdowns ────────────────────────────────────────────────────
  listaFamilias = FAMILIAS;
  listaSedes    = SEDES;

  // ── Computed ─────────────────────────────────────────────────────
  hayResultados = computed(() => this.empleadosFiltrados().length > 0);

  // ── Internos ─────────────────────────────────────────────────────
  todosLosEmpleados: Empleado[] = [];
  private busquedaSubject = new Subject<void>();
  private destroy$        = new Subject<void>();
  rolUsuario: string = '';

  modalAbierto = false;
  guardando    = false;
  errorModal   = '';
  form: any = {
    legajo: '', codigo_arsa: '', apellido_nombre: '',
    sede: '', puesto: '', categoria: '', estado_relev: 'PENDIENTE'
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    // Debounce para búsqueda de texto
    this.busquedaSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.aplicarFiltros());

const raw = localStorage.getItem('usuario');
if (raw) {
    this.rolUsuario = (JSON.parse(raw).rol || '').toLowerCase();
}
if (this.rolUsuario === 'rrhh') {
    this.filtroEstado = 'COMPLETADO';
}

    // Cargar todos los empleados al iniciar
    this.cargarNomina();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga inicial desde ApiService ───────────────────────────────
  cargarNomina() {
    this.cargando.set(true);
    this.errorMsg.set('');

    this.api.leerTabla('Nomina').subscribe({
      next: (res) => {
        if (res.ok) {
          this.todosLosEmpleados = (res.data as any[]).map(r => ({
            codigo_arsa:     r.codigo_arsa     || '—',
            legajo:          r.legajo          || '—',
            apellido_nombre: r.apellido_nombre || '—',
            sede:            r.sede            || '—',
            puesto:          r.puesto          || '—',
            categoria:       r.categoria       || '—',
            estado_relev:    r.estado_relev === 'PRESENTADO A RRHH' ? 'COMPLETADO' : (r.estado_relev || 'PENDIENTE'),
          }));
          this.aplicarFiltros();
        } else {
          this.errorMsg.set('Error al cargar la nómina');
        }
        this.cargando.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudo conectar con Google Sheets');
        this.cargando.set(false);
      }
    });
  }

  // ── Filtros locales (sin llamada a API) ───────────────────────────
  aplicarFiltros() {
    let lista = [...this.todosLosEmpleados];

    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase().trim();
      lista = lista.filter(e =>
        e.apellido_nombre.toLowerCase().includes(q) ||
        e.legajo.toLowerCase().includes(q) ||
        e.codigo_arsa.toLowerCase().includes(q)
      );
    }

    if (this.filtroSede) {
      lista = lista.filter(e =>
        e.sede.toLowerCase().includes(this.filtroSede.toLowerCase())
      );
    }

    if (this.filtroFamilia) {
      lista = lista.filter(e =>
        e.codigo_arsa.toUpperCase().startsWith(this.filtroFamilia.toUpperCase())
      );
    }

    if (this.filtroEstado) {
      lista = lista.filter(e =>
        e.estado_relev.toUpperCase() === this.filtroEstado.toUpperCase()
      );
    }

    this.empleadosFiltrados.set(lista);
  }

  // ── Eventos ───────────────────────────────────────────────────────
  get hayFiltro(): boolean {
    return !!(this.busqueda || this.filtroSede || this.filtroFamilia || this.filtroEstado);
  }

  buscar() {
    this.busquedaSubject.next();
  }

  onFiltroChange() {
    this.busqueda = '';
    this.aplicarFiltros();
  }

  limpiarBusqueda() {
    this.busqueda = '';
    this.aplicarFiltros();
  }

  limpiarFiltros() {
    this.busqueda = this.filtroSede = this.filtroFamilia = this.filtroEstado = '';
    this.empleadosFiltrados.set(this.todosLosEmpleados);
    this.errorMsg.set('');
  }

  refrescar() {
    this.todosLosEmpleados = [];
    this.empleadosFiltrados.set([]);
    this.cargarNomina();
  }

  // ── Exportar CSV ──────────────────────────────────────────────────
  exportarCSV() {
    if (!this.hayResultados()) return;
    const headers = ['Código ARSA', 'Legajo', 'Empleado', 'Sede', 'Puesto', 'CAT', 'Estado'];
    const filas   = this.empleadosFiltrados().map(e => [
      e.codigo_arsa, e.legajo, e.apellido_nombre,
      e.sede, e.puesto, e.categoria, e.estado_relev
    ]);
    const csv = [headers, ...filas]
      .map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `arsa-nomina-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  // ── TrackBy ───────────────────────────────────────────────────────
  trackByLegajo(_: number, e: Empleado): string { return e.legajo; }

  // ── Helpers CSS ───────────────────────────────────────────────────
  estadoClass(e: string): string {
    const m: Record<string, string> = {
      'COMPLETADO':   'b-ok',
      'COMPLETADA':   'b-ok',
      'REVISIÓN':     'b-rev',
      'ENTREVISTADO': 'b-proc',
      'EN PROCESO':   'b-proc',
    };
    return m[e?.toUpperCase()] || 'b-pend';
  }

  estadoLabel(e: string): string {
    const m: Record<string, string> = {
      'COMPLETADO':   'Presentado a RRHH',
      'COMPLETADA':   'Presentado a RRHH',
      'REVISIÓN':     'Revisión',
      'ENTREVISTADO': 'Entrevistado',
      'EN PROCESO':   'En proceso',
    };
    return m[e?.toUpperCase()] || 'Pendiente';
  }

  catClass(cat: string): string {
    const m: Record<string, string> = {
      'CAT1': 'cat1', 'CAT2': 'cat2', 'CAT3': 'cat3', 'CAT4': 'cat4'
    };
    return m[cat?.toUpperCase().replace(/\s/g, '')] || 'cat-c';
  }

  catLabel(cat: string): string {
    const c = cat?.toUpperCase().replace(/\s/g, '');
    if (c === 'CAT1') return 'CAT 1';
    if (c === 'CAT2') return 'CAT 2';
    if (c === 'CAT3') return 'CAT 3';
    if (c === 'CAT4') return 'CAT 4';
    return cat || '—';
  }

  formVacio() {
    return {
      legajo: '', codigo_arsa: '', apellido_nombre: '',
      sede: '', puesto: '', categoria: '', estado_relev: 'PENDIENTE'
    };
  }

  abrirModal() {
    this.form = this.formVacio();
    this.errorModal = '';
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
  }

  guardar() {
    if (!this.form.legajo || !this.form.apellido_nombre) {
      this.errorModal = 'Legajo y nombre son obligatorios.';
      return;
    }
    this.guardando = true;
    this.errorModal = '';
    this.api.post({ action: 'createEmpleado', data: this.form }).subscribe({ error: () => {} });
    setTimeout(() => {
      this.guardando = false;
      this.cerrarModal();
      this.refrescar();
    }, 2000);
  }
}