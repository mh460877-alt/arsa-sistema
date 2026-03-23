import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyqJeyc1IowWB90pWXYqT8vHSpeAjiKgtD-FybWtQumCvf0a1gNqWM8F12e6GaCGJX8/exec';

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
  private ultimaQuery     = '';
  private ultimoResultado: any[] = [];

  // ─────────────────────────────────────────────────────────────────
  ngOnInit() {
    const raw = localStorage.getItem('usuario');
    if (raw) {
      try { this.rolUsuario = JSON.parse(raw).rol || ''; } catch {}
    }
    this.cargarStats();
    if (this.ultimoResultado.length > 0) this.empleados.set(this.ultimoResultado);
  }

  get hayFiltro(): boolean {
    return !!(this.busqueda || this.filtroSede || this.filtroFamilia || this.filtroEstado);
  }

  // ── Helpers de estado ─────────────────────────────────────────────

  // Un perfil está publicado cuando: COMPLETADO + tiene link definitivo
  estaPublicado(emp: any): boolean {
    return emp.estado?.toUpperCase() === 'COMPLETADO' && !!emp.linkDefinitivo;
  }

  // Definitivo pendiente de carga: está en REVISIÓN pero sin link definitivo aún
  definitivoPendiente(emp: any): boolean {
    return emp.estado?.toUpperCase() === 'REVISIÓN' && !emp.linkDefinitivo;
  }

  // Definitivo cargado pero NO completado: hay link pero falta aprobar
  definitivoSinAprobar(emp: any): boolean {
    return !!emp.linkDefinitivo && emp.estado?.toUpperCase() !== 'COMPLETADO';
  }

  // Tiene observación de RRHH visible (cuando está en REVISIÓN)
  tieneObservacion(emp: any): boolean {
    return emp.estado?.toUpperCase() === 'REVISIÓN' && !!emp.observacion;
  }

  // ── Stats ─────────────────────────────────────────────────────────
  async cargarStats(): Promise<void> {
    try {
      const res  = await fetch(`${APPS_SCRIPT_URL}?accion=stats`);
      const data = await res.json();
      if (data.ok) {
        const d = data.data;
        this.stats = {
          total:        d.total,
          pendiente:    d.porEstado['PENDIENTE']    || 0,
          entrevistado: d.porEstado['ENTREVISTADO'] || 0,
          revision:     d.porEstado['REVISIÓN']     || 0,
          completado:   d.porEstado['COMPLETADO']   || 0,
          avance:       d.avancePct                 || 0,
        };
      }
    } catch { /* silencioso */ }
  }

  // ── Filtros ───────────────────────────────────────────────────────
  onFiltroChange() {
    if (!this.busqueda) this.buscar();
  }

  // ── Búsqueda ──────────────────────────────────────────────────────
  async buscar(): Promise<void> {
    if (!this.hayFiltro) { this.empleados.set([]); return; }

    const params = new URLSearchParams({ accion: 'nomina', rol: this.rolUsuario || 'admin' });
    if (this.busqueda)      params.set('q',       this.busqueda.trim());
    if (this.filtroSede)    params.set('sede',     this.filtroSede);
    if (this.filtroFamilia) params.set('familia',  this.filtroFamilia);
    if (this.filtroEstado)  params.set('estado',   this.filtroEstado);

    const queryActual = params.toString();
    if (queryActual === this.ultimaQuery && this.hayResultados()) return;

    this.ultimaQuery = queryActual;
    this.cargando.set(true);
    this.errorMsg.set('');

    try {
      const res  = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        this.empleados.set(data.data || []);
        this.ultimoResultado = data.data || [];
      } else {
        this.errorMsg.set(data.error || 'Error al consultar');
        this.empleados.set([]);
      }
    } catch {
      this.errorMsg.set('No se pudo conectar con Google Sheets');
      this.empleados.set([]);
    } finally {
      this.cargando.set(false);
    }
  }

  // ── Cambiar estado con lógica de publicación ──────────────────────
  async cambiarEstado(emp: any, nuevoEstado: string): Promise<void> {
    const anterior = emp.estado;

    // Si pasa a COMPLETADO pero no tiene link definitivo → bloquear
    if (nuevoEstado === 'COMPLETADO' && !emp.linkDefinitivo) {
      this.errorMsg.set(`${emp.apellido_nombre} no tiene link definitivo cargado. Cargá el link antes de completar.`);
      setTimeout(() => this.errorMsg.set(''), 5000);
      return;
    }

    // Reflejo inmediato en memoria
    this.empleados.update(l =>
      l.map(e => e.legajo === emp.legajo ? { ...e, estado: nuevoEstado } : e)
    );

    try {
      const res  = await fetch(APPS_SCRIPT_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify({ accion: 'actualizarEstado', legajo: emp.legajo, estado: nuevoEstado })
      });
      const data = await res.json();
      if (!data.ok) {
        // Revertir si falló
        this.empleados.update(l =>
          l.map(e => e.legajo === emp.legajo ? { ...e, estado: anterior } : e)
        );
        this.errorMsg.set('Error al actualizar estado');
      } else {
        this.cargarStats();
      }
    } catch {
      this.empleados.update(l =>
        l.map(e => e.legajo === emp.legajo ? { ...e, estado: anterior } : e)
      );
    }
  }

  // ── Toggle fila privada ───────────────────────────────────────────
  toggleDetalle(legajo: string) {
    this.filaAbierta = this.filaAbierta === legajo ? '' : legajo;
  }

  // ── Guardar privados ──────────────────────────────────────────────
  async guardarPrivados(emp: any): Promise<void> {
    try {
      const res  = await fetch(APPS_SCRIPT_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify({
          accion:        'guardarPrivados',
          legajo:        emp.legajo,
          transcripcion: emp.transcripcion || '',
          eneagrama:     emp.eneagrama     || '',
          observacion:   emp.observacion   || '',
        })
      });
      const data = await res.json();
      if (data.ok) {
        this.guardadoMsg = emp.legajo;
        setTimeout(() => this.guardadoMsg = '', 3000);
      } else {
        this.errorMsg.set(data.error || 'Error al guardar');
      }
    } catch {
      this.errorMsg.set('Error de conexión');
    }
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

  async confirmarLink(): Promise<void> {
    if (!this.modalLink.url || !this.modalLink.empleado) return;
    const { empleado: emp, tipo, url } = this.modalLink;
    const urlLimpia = url.trim();

    try {
      const res  = await fetch(APPS_SCRIPT_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify({
          accion:         'actualizarLinks',
          legajo:         emp.legajo,
          linkBorrador:   tipo === 'borrador'   ? urlLimpia : undefined,
          linkDefinitivo: tipo === 'definitivo' ? urlLimpia : undefined,
        })
      });
      const data = await res.json();
      if (data.ok) {
        // Reflejar en memoria
        this.empleados.update(l => l.map(e => {
          if (e.legajo !== emp.legajo) return e;
          return tipo === 'borrador'
            ? { ...e, linkBorrador:   urlLimpia }
            : { ...e, linkDefinitivo: urlLimpia };
        }));
        this.cerrarModal();
      } else {
        this.errorMsg.set(data.error || 'Error al guardar link');
      }
    } catch {
      this.errorMsg.set('Error de conexión');
    }
  }

  // ── Limpiar ───────────────────────────────────────────────────────
  limpiarFiltros() {
    this.busqueda = this.filtroSede = this.filtroFamilia = this.filtroEstado = '';
    this.empleados.set([]);
    this.ultimaQuery = '';
    this.errorMsg.set('');
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