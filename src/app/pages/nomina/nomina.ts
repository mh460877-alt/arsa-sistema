import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyqJeyc1IowWB90pWXYqT8vHSpeAjiKgtD-FybWtQumCvf0a1gNqWM8F12e6GaCGJX8/exec';

export interface Empleado {
  codigo:          string;
  legajo:          string;
  apellido:        string;
  nombre:          string;
  apellido_nombre: string;
  puesto:          string;
  sede:            string;
  sedeCode:        string;
  sedeName:        string;
  familia:         string;
  familiaNombre:   string;
  catServicio:     string;
  nivel:           string;
  nivel_cct:       string;
  basico:          string;
  estado:          string;
  linkBorrador:    string;
  linkDefinitivo:  string;
  dominio:         string;
  transcripcion?:  string;
  eneagrama?:      string;
  observacion?:    string;
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
  { code: 'BRC', name: 'Bariloche' },
  { code: 'GRC', name: 'Gral. Roca' },
  { code: 'VDM', name: 'Viedma' },
  { code: 'ALL', name: 'Allen' },
  { code: 'CAT', name: 'Catriel' },
  { code: 'CHO', name: 'Choele Choel' },
  { code: '5ST', name: 'Cinco Saltos' },
  { code: 'CPT', name: 'Cipolletti' },
  { code: 'FRO', name: 'Fernández Oro' },
  { code: 'HUE', name: 'Ing. Huergo' },
  { code: 'RCO', name: 'Río Colorado' },
  { code: 'SAO', name: 'S.A.O.' },
  { code: 'CNS', name: 'Gral. Conesa' },
  { code: 'LGR', name: 'Las Grutas' },
  { code: 'SGR', name: 'Sierra Grande' },
  { code: 'VAL', name: 'Valcheta' },
  { code: 'GEG', name: 'Gral. Enrique Godoy' },
  { code: 'CRV', name: 'Cervantes' },
  { code: 'CHK', name: 'Chichinales' },
  { code: 'CCO', name: 'Clte. Cordero' },
  { code: 'CBE', name: 'Cnel. Belisle' },
  { code: 'COM', name: 'Comallo' },
  { code: 'CNI', name: 'Cona Niyeu' },
  { code: 'DAR', name: 'Darwin' },
  { code: 'ELB', name: 'El Bolsón' },
  { code: 'ELC', name: 'El Cóndor' },
  { code: 'GMI', name: 'Guardia Mitre' },
  { code: 'LPE', name: 'Lago Pellegrini' },
  { code: 'LBE', name: 'Los Berros' },
  { code: 'LME', name: 'Los Menucos' },
  { code: 'MQC', name: 'Maquinchao' },
  { code: 'PLP', name: 'Paraje Las Perlas' },
  { code: 'PIL', name: 'Pilcaniyeu' },
  { code: 'POM', name: 'Pomona' },
  { code: 'PSE', name: 'Puerto S.A.E.' },
  { code: 'RME', name: 'Ramos Mexía' },
  { code: 'RCH', name: 'Río Chico' },
  { code: 'SJV', name: 'San Javier' },
  { code: 'SCO', name: 'Sierra Colorada' },
  { code: 'VRE', name: 'Villa Regina' },
  { code: 'NOR', name: 'Ñorquinco' },
  { code: 'VDC', name: 'Viedma Central' },
  { code: 'SAV', name: 'Subg. Alto Valle' },
  { code: 'SVE', name: 'Subg. Alto Valle Este' },
  { code: 'SAN', name: 'Subg. Andina' },
  { code: 'SAT', name: 'Subg. Atlántica' },
  { code: 'SES', name: 'Subg. Este' },
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
  empleados = signal<Empleado[]>([]);
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

  // ── Internos ─────────────────────────────────────────────────────
  private ultimaQuery     = '';
  private ultimoResultado: Empleado[] = [];
  private busquedaSubject = new Subject<void>();
  private destroy$        = new Subject<void>();

  ngOnInit() {
    // Debounce 450ms para texto libre
    this.busquedaSubject.pipe(
      debounceTime(450),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.buscar());

    // Restaurar última búsqueda si volvió al módulo
    if (this.ultimoResultado.length > 0) {
      this.empleados.set(this.ultimoResultado);
    }
  }

  ngOnDestroy() {
    this.ultimoResultado = this.empleados();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Getters ──────────────────────────────────────────────────────
  get hayFiltro(): boolean {
    return !!(this.busqueda || this.filtroSede || this.filtroFamilia || this.filtroEstado);
  }

  // ── Eventos filtro ────────────────────────────────────────────────
  onFiltroChange() {
    // Dropdown cambia → limpia el texto y busca solo con el dropdown
    this.busqueda    = '';
    this.ultimaQuery = '';
    this.buscar();
  }

  // ── Búsqueda principal ────────────────────────────────────────────
  async buscar(): Promise<void> {
    if (!this.hayFiltro) {
      this.empleados.set([]);
      return;
    }

    const params = new URLSearchParams({ accion: 'nomina' });
    if (this.busqueda)      params.set('q',       this.busqueda.trim());
    if (this.filtroSede)    params.set('sede',    this.filtroSede);
    if (this.filtroFamilia) params.set('familia', this.filtroFamilia);
    if (this.filtroEstado)  params.set('estado',  this.filtroEstado);

    // Si la query no cambió y ya hay resultados → no llamar de nuevo
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
        this.errorMsg.set(data.error || 'Error al consultar los datos');
        this.empleados.set([]);
      }
    } catch (err: any) {
      this.errorMsg.set('No se pudo conectar con Google Sheets');
      this.empleados.set([]);
    } finally {
      this.cargando.set(false);
    }
  }

  // ── Actualizar estado en Sheets ───────────────────────────────────
  async actualizarEstado(legajo: string, nuevoEstado: string): Promise<void> {
    try {
      const res  = await fetch(APPS_SCRIPT_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify({ accion: 'actualizarEstado', legajo, estado: nuevoEstado })
      });
      const data = await res.json();

      if (data.ok) {
        // Reflejo inmediato en memoria
        this.empleados.update(lista =>
          lista.map(e => e.legajo === legajo ? { ...e, estado: nuevoEstado } : e)
        );
      } else {
        this.errorMsg.set(data.error || 'Error al actualizar estado');
      }
    } catch (err: any) {
      this.errorMsg.set('Error de conexión al actualizar');
    }
  }

  // ── Refrescar forzado ─────────────────────────────────────────────
  async refrescar(): Promise<void> {
    this.ultimaQuery = '';
    await this.buscar();
  }

  // ── Limpiar ───────────────────────────────────────────────────────
  limpiarBusqueda() {
    this.busqueda    = '';
    this.ultimaQuery = '';
    if (this.hayFiltro) this.buscar();
    else this.empleados.set([]);
  }

  limpiarFiltros() {
    this.busqueda = this.filtroSede = this.filtroFamilia = this.filtroEstado = '';
    this.empleados.set([]);
    this.ultimaQuery = '';
    this.errorMsg.set('');
  }

  // ── Exportar CSV ──────────────────────────────────────────────────
  exportarCSV() {
    if (!this.hayResultados()) return;
    const headers = ['Legajo','Apellido y Nombre','Código','Familia','Sede','Nivel','CAT','Estado'];
    const filas   = this.empleados().map(e => [
      e.legajo, e.apellido_nombre, e.codigo,
      e.familiaNombre, e.sedeName || e.sede,
      e.nivel, e.catServicio, e.estado
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
      'REVISIÓN':     'b-rev',
      'ENTREVISTADO': 'b-proc'
    };
    return m[e?.toUpperCase()] || 'b-pend';
  }

  estadoLabel(e: string): string {
    const m: Record<string, string> = {
      'COMPLETADO':   'Completado',
      'REVISIÓN':     'Revisión',
      'ENTREVISTADO': 'Entrevistado'
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
}