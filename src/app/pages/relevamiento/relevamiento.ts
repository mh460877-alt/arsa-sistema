import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

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
  { code: 'BRC', name: 'Bariloche' },       { code: 'GRC', name: 'Gral. Roca' },
  { code: 'VDM', name: 'Viedma' },           { code: 'ALL', name: 'Allen' },
  { code: 'CAT', name: 'Catriel' },          { code: 'CHO', name: 'Choele Choel' },
  { code: '5ST', name: 'Cinco Saltos' },     { code: 'CPT', name: 'Cipolletti' },
  { code: 'FRO', name: 'Fernández Oro' },    { code: 'HUE', name: 'Ing. Huergo' },
  { code: 'RCO', name: 'Río Colorado' },     { code: 'SAO', name: 'S.A.O.' },
  { code: 'CNS', name: 'Gral. Conesa' },     { code: 'LGR', name: 'Las Grutas' },
  { code: 'SGR', name: 'Sierra Grande' },    { code: 'VAL', name: 'Valcheta' },
  { code: 'GEG', name: 'Gral. Enrique Godoy' }, { code: 'CRV', name: 'Cervantes' },
  { code: 'CHK', name: 'Chichinales' },      { code: 'CCO', name: 'Clte. Cordero' },
  { code: 'CBE', name: 'Cnel. Belisle' },    { code: 'COM', name: 'Comallo' },
  { code: 'CNI', name: 'Cona Niyeu' },       { code: 'DAR', name: 'Darwin' },
  { code: 'ELB', name: 'El Bolsón' },        { code: 'ELC', name: 'El Cóndor' },
  { code: 'GMI', name: 'Guardia Mitre' },    { code: 'LPE', name: 'Lago Pellegrini' },
  { code: 'LBE', name: 'Los Berros' },       { code: 'LME', name: 'Los Menucos' },
  { code: 'MQC', name: 'Maquinchao' },       { code: 'PLP', name: 'Paraje Las Perlas' },
  { code: 'PIL', name: 'Pilcaniyeu' },        { code: 'POM', name: 'Pomona' },
  { code: 'PSE', name: 'Puerto S.A.E.' },    { code: 'RME', name: 'Ramos Mexía' },
  { code: 'RCH', name: 'Río Chico' },        { code: 'SJV', name: 'San Javier' },
  { code: 'SCO', name: 'Sierra Colorada' },  { code: 'VRE', name: 'Villa Regina' },
  { code: 'NOR', name: 'Ñorquinco' },        { code: 'VDC', name: 'Viedma Central' },
  { code: 'SAV', name: 'Subg. Alto Valle' }, { code: 'SVE', name: 'Subg. Alto Valle Este' },
  { code: 'SAN', name: 'Subg. Andina' },     { code: 'SAT', name: 'Subg. Atlántica' },
  { code: 'SES', name: 'Subg. Este' },
];

@Component({
  selector: 'app-relevamiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './relevamiento.html',
  styleUrl: './relevamiento.css'
})
export class Relevamiento implements OnInit {

  // ── Signals ──────────────────────────────────────────────────────
  empleados = signal<any[]>([]);
  cargando  = signal(false);
  errorMsg  = signal('');

  // ── Filtros ──────────────────────────────────────────────────────
  busqueda      = '';
  filtroSede    = '';
  filtroFamilia = '';
  filtroEstado  = '';

  // ── Dropdowns ────────────────────────────────────────────────────
  listaFamilias = FAMILIAS;
  listaSedes    = SEDES;

  // ── Computed ─────────────────────────────────────────────────────
  hayResultados = computed(() => this.empleados().length > 0);

  // ── Rol desde localStorage ────────────────────────────────────────
  rolUsuario = '';

  get esPrivilegiado(): boolean {
    return this.rolUsuario === 'admin' || this.rolUsuario === 'rrhh';
  }

  get puedeEditar(): boolean {
    return this.rolUsuario === 'admin';
  }

  // ── UI ────────────────────────────────────────────────────────────
  filaAbierta = '';
  guardadoMsg = '';

  // ── Stats ─────────────────────────────────────────────────────────
  stats = { total: 859, pendiente: 0, entrevistado: 0, revision: 0, completado: 0, avance: 0 };

  // ── Modal link ────────────────────────────────────────────────────
  modalLink: {
    abierto:  boolean;
    tipo:     'borrador' | 'definitivo';
    empleado: any;
    url:      string;
  } = { abierto: false, tipo: 'borrador', empleado: null, url: '' };

  // ── Internos ──────────────────────────────────────────────────────
  private todosLosEmpleados: any[] = [];

  constructor(private api: ApiService) {}

  // ─────────────────────────────────────────────────────────────────
  ngOnInit() {
    const raw = localStorage.getItem('usuario');
    if (raw) {
      try { this.rolUsuario = JSON.parse(raw).rol || ''; } catch {}
    }
    this.cargarStats();
  }

  get hayFiltro(): boolean {
    return !!(this.busqueda || this.filtroSede || this.filtroFamilia || this.filtroEstado);
  }

  // ── Helpers de estado ─────────────────────────────────────────────
  estaPublicado(emp: any): boolean {
    return emp.estado?.toUpperCase() === 'COMPLETADO' && !!emp.linkDefinitivo;
  }

  definitivoPendiente(emp: any): boolean {
    return emp.estado?.toUpperCase() === 'REVISIÓN' && !emp.linkDefinitivo;
  }

  definitivoSinAprobar(emp: any): boolean {
    return !!emp.linkDefinitivo && emp.estado?.toUpperCase() !== 'COMPLETADO';
  }

  tieneObservacion(emp: any): boolean {
    return emp.estado?.toUpperCase() === 'REVISIÓN' && !!emp.observacion;
  }

  // ── Stats desde ApiService ────────────────────────────────────────
  cargarStats(): void {
    this.api.stats().subscribe({
      next: (res) => {
        if (res.ok) {
          const d = res.data;
          // Calcular pendientes desde la nómina total menos completadas
          const completado   = d.completadas || 0;
          const total        = d.total_empleados || 859;
          const entrevistado = d.total_entrevistas || 0;
          this.stats = {
            total,
            pendiente:    Math.max(0, total - entrevistado),
            entrevistado: Math.max(0, entrevistado - completado),
            revision:     0,
            completado,
            avance:       total > 0 ? Math.round((completado / total) * 100) : 0,
          };
        }
      },
      error: () => { /* silencioso */ }
    });
  }

  // ── Filtros ───────────────────────────────────────────────────────
  onFiltroChange() {
    if (!this.busqueda) this.buscar();
  }

  // ── Búsqueda — lee Nomina y filtra localmente ─────────────────────
  buscar(): void {
    if (!this.hayFiltro) { this.empleados.set([]); return; }

    this.cargando.set(true);
    this.errorMsg.set('');

    // Si ya tenemos datos cargados, solo filtrar
    if (this.todosLosEmpleados.length > 0) {
      this.aplicarFiltros();
      this.cargando.set(false);
      return;
    }

    // Primera carga: leer la hoja Nomina
    this.api.leerTabla('Nomina').subscribe({
      next: (res) => {
        if (res.ok) {
          this.todosLosEmpleados = (res.data as any[]).map(r => ({
            legajo:          r.legajo          || '—',
            apellido_nombre: r.apellido_nombre || '—',
            codigo:          r.codigo_arsa     || '—',
            sede:            r.sede            || '—',
            sedeName:        r.sede            || '—',
            familia:         (r.codigo_arsa || '').split('-')[0] || '—',
            familiaNombre:   r.puesto          || '—',
            estado:          (r.estado_relev   || 'PENDIENTE').toUpperCase(),
            linkBorrador:    r.link_sin_revision  || '',
            linkDefinitivo:  r.link_definitivo    || '',
            transcripcion:   r.transcripcion      || '',
            eneagrama:       r.eneagrama           || '',
            observacion:     r.observacion_privada || '',
          }));
          this.aplicarFiltros();
        } else {
          this.errorMsg.set(res.error || 'Error al consultar');
          this.empleados.set([]);
        }
        this.cargando.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudo conectar con Google Sheets');
        this.empleados.set([]);
        this.cargando.set(false);
      }
    });
  }

  private aplicarFiltros(): void {
    let lista = [...this.todosLosEmpleados];

    if (this.busqueda.trim()) {
      const q = this.busqueda.toLowerCase().trim();
      lista = lista.filter(e =>
        e.apellido_nombre.toLowerCase().includes(q) ||
        e.legajo.toLowerCase().includes(q) ||
        e.codigo.toLowerCase().includes(q)
      );
    }

    if (this.filtroSede) {
      lista = lista.filter(e =>
        e.sede.toLowerCase().includes(
          SEDES.find(s => s.code === this.filtroSede)?.name.toLowerCase() || this.filtroSede.toLowerCase()
        )
      );
    }

    if (this.filtroFamilia) {
      lista = lista.filter(e =>
        e.codigo.toUpperCase().startsWith(this.filtroFamilia.toUpperCase())
      );
    }

    if (this.filtroEstado) {
      lista = lista.filter(e =>
        e.estado.toUpperCase() === this.filtroEstado.toUpperCase()
      );
    }

    this.empleados.set(lista);
  }

  // ── Cambiar estado ────────────────────────────────────────────────
  cambiarEstado(emp: any, nuevoEstado: string): void {
    const anterior = emp.estado;

    if (nuevoEstado === 'COMPLETADO' && !emp.linkDefinitivo) {
      this.errorMsg.set(`${emp.apellido_nombre} no tiene link definitivo cargado. Cargá el link antes de completar.`);
      setTimeout(() => this.errorMsg.set(''), 5000);
      return;
    }

    // Reflejo inmediato en memoria
    this.empleados.update(l =>
      l.map(e => e.legajo === emp.legajo ? { ...e, estado: nuevoEstado } : e)
    );
    this.todosLosEmpleados = this.todosLosEmpleados.map(e =>
      e.legajo === emp.legajo ? { ...e, estado: nuevoEstado } : e
    );

    this.api.post({
      action: 'updateEntrevista',
      data: { id_entrevista: emp.legajo, estado: nuevoEstado }
    }).subscribe({
      next: (res) => {
        if (!res.ok) {
          this.empleados.update(l =>
            l.map(e => e.legajo === emp.legajo ? { ...e, estado: anterior } : e)
          );
          this.errorMsg.set('Error al actualizar estado');
        } else {
          this.cargarStats();
        }
      },
      error: () => {
        this.empleados.update(l =>
          l.map(e => e.legajo === emp.legajo ? { ...e, estado: anterior } : e)
        );
      }
    });
  }

  // ── Toggle fila privada ───────────────────────────────────────────
  toggleDetalle(legajo: string) {
    this.filaAbierta = this.filaAbierta === legajo ? '' : legajo;
  }

  // ── Guardar privados ──────────────────────────────────────────────
  guardarPrivados(emp: any): void {
    this.api.post({
      action: 'updateEntrevista',
      data: {
        id_entrevista:       emp.legajo,
        transcripcion:       emp.transcripcion || '',
        eneagrama:           emp.eneagrama     || '',
        observacion_privada: emp.observacion   || '',
      }
    }).subscribe({
      next: (res) => {
        if (res.ok) {
          this.guardadoMsg = emp.legajo;
          setTimeout(() => this.guardadoMsg = '', 3000);
        } else {
          this.errorMsg.set(res.error || 'Error al guardar');
        }
      },
      error: () => { this.errorMsg.set('Error de conexión'); }
    });
  }

  // ── Modal link ────────────────────────────────────────────────────
  abrirModalLink(emp: any, tipo: 'borrador' | 'definitivo') {
    this.modalLink = {
      abierto: true, tipo, empleado: emp,
      url: tipo === 'borrador' ? (emp.linkBorrador || '') : (emp.linkDefinitivo || '')
    };
  }

  cerrarModal() {
    this.modalLink = { abierto: false, tipo: 'borrador', empleado: null, url: '' };
  }

  confirmarLink(): void {
    if (!this.modalLink.url || !this.modalLink.empleado) return;
    const { empleado: emp, tipo, url } = this.modalLink;
    const urlLimpia = url.trim();

    this.api.post({
      action: 'updateEntrevista',
      data: {
        id_entrevista:     emp.legajo,
        link_sin_revision: tipo === 'borrador'   ? urlLimpia : undefined,
        link_definitivo:   tipo === 'definitivo' ? urlLimpia : undefined,
      }
    }).subscribe({
      next: (res) => {
        if (res.ok) {
          this.empleados.update(l => l.map(e => {
            if (e.legajo !== emp.legajo) return e;
            return tipo === 'borrador'
              ? { ...e, linkBorrador:   urlLimpia }
              : { ...e, linkDefinitivo: urlLimpia };
          }));
          this.todosLosEmpleados = this.todosLosEmpleados.map(e => {
            if (e.legajo !== emp.legajo) return e;
            return tipo === 'borrador'
              ? { ...e, linkBorrador:   urlLimpia }
              : { ...e, linkDefinitivo: urlLimpia };
          });
          this.cerrarModal();
        } else {
          this.errorMsg.set(res.error || 'Error al guardar link');
        }
      },
      error: () => { this.errorMsg.set('Error de conexión'); }
    });
  }

  // ── Limpiar ───────────────────────────────────────────────────────
  limpiarFiltros() {
    this.busqueda = this.filtroSede = this.filtroFamilia = this.filtroEstado = '';
    this.empleados.set([]);
    this.errorMsg.set('');
  }

  refrescar() {
    this.todosLosEmpleados = [];
    this.empleados.set([]);
    this.buscar();
  }

  // ── Exportar CSV ──────────────────────────────────────────────────
  exportarCSV() {
    if (!this.hayResultados()) return;
    const headers = ['Legajo','Empleado','Código','Sede','Familia','Estado','Publicado','Borrador','Definitivo'];
    const filas   = this.empleados().map(e => [
      e.legajo, e.apellido_nombre, e.codigo,
      e.sedeName || e.sede, e.familiaNombre, e.estado,
      this.estaPublicado(e) ? 'Sí' : 'No',
      e.linkBorrador || '', e.linkDefinitivo || ''
    ]);
    const csv = [headers, ...filas]
      .map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `arsa-relevamiento-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  abrirLink(url: string) { if (url) window.open(url, '_blank'); }
  trackByLegajo(_: number, e: any): string { return e.legajo; }

  estadoClass(estado: string): string {
    const m: Record<string, string> = {
      'COMPLETADO':   'est-ok',
      'REVISIÓN':     'est-rev',
      'ENTREVISTADO': 'est-proc',
      'PENDIENTE':    'est-pend',
    };
    return m[estado?.toUpperCase()] || 'est-pend';
  }
}