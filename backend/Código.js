// ══════════════════════════════════════════════════════════════════
//  ARSA · Apps Script — API Nómina v3
//  Campos verificados del Excel real
//  Escencial Consultora · 2026
//
//  INSTRUCCIONES:
//  1. Google Sheets → Extensiones → Apps Script
//  2. Pegá este código completo y guardá
//  4. Implementar → Nueva implementación
//     · Tipo: Aplicación web
//     · Ejecutar como: Yo
//     · Acceso: Cualquier persona
//  5. Copiá la URL → pegala en environment.ts como APPS_SCRIPT_URL
// ══════════════════════════════════════════════════════════════════

const HOJA        = 'NOMENCLADOR DE PUESTO';
const FILA_INICIO = 3;   // fila 1=título, 2=encabezados, 3=primer empleado

// Índices de columna (base 0 = columna A)
const COL = {
  CODIGO:        0,   // A  - CÓDIGO PUESTO
  COD_COMPLETO:  1,   // B  - CÓDIGO COMPLETO
  NRO_FAM:       2,   // C  - NRO FAM
  LEGAJO:        3,   // D  - LEGAJO
  APELLIDO:      4,   // E  - APELLIDO
  NOMBRE:        5,   // F  - NOMBRE
  SEDE:          6,   // G  - SEDE / ORGANIZACIÓN
  CAT_SERV:      7,   // H  - CAT SERV
  RIESGO:        8,   // I  - RIESGO OPERATIVO
  FUNCION_CCT:   9,   // J  - FUNCIÓN CCT
  FAMILIA:      10,   // K  - FAMILIA
  // L (idx 11) vacía — no se usa
  CAT_NTS:      12,   // M  - CATEGORÍA N-T-ST
  REGIMEN:      13,   // N  - RÉGIMEN
  BASICO:       14,   // O  - BÁSICO FEB 2026
  ESTADO:       15,   // P  - ESTADO RELEVAMIENTO
  PERFIL_ANT:   16,   // Q  - PERFIL ANTERIOR
  AGENDA:       17,   // R  - AGENDA
  TRANSCRIPT:   18,   // S  - link/archivo de transcripción (OPCIONAL)
  LINK_BORRAD:  19,   // T  - link del perfil sin revisión / borrador (OPCIONAL)
  LINK_DEFIN:   20,   // U  - link definitivo (OBLIGATORIO para presentar a RRHH)
  DOMINIO:      21,   // V  - DOMINIO EMPLEADO
  ENEAGRAMA:    22,   // W  - eneagrama (privado)
  OBSERVACION:  23,   // X  - observación (privado)
  PROC_INTER:   24,   // Y  - proceso intervinientes
};

const ESTADOS_VALIDOS = ['PENDIENTE', 'ENTREVISTADO', 'REVISIÓN', 'COMPLETADO'];

const FAMILIAS = {
  'OPA':'Operaciones Agua','ADM':'Administración','AYC':'Operaciones A y C',
  'EM':'Electromecánica / Mant.','OPC':'Operaciones Cloacas','TEC':'Técnica / Planta',
  'JEF':'Jefatura de Servicio','CAP':'Capataz','COM':'Gestión Comercial',
  'PROF':'Profesional','GER':'Gerencia / Subgerencia','OTR':'Otros','PAS':'Pasantía'
};

const SEDES = {
  'BRC':'Bariloche','GRC':'Gral. Roca','VDM':'Viedma','ALL':'Allen',
  'CAT':'Catriel','CHO':'Choele Choel','5ST':'Cinco Saltos','CPT':'Cipolletti',
  'FRO':'Fernández Oro','HUE':'Ing. Huergo','RCO':'Río Colorado','SAO':'S.A.O.',
  'CNS':'Gral. Conesa','LGR':'Las Grutas','SGR':'Sierra Grande','VAL':'Valcheta',
  'GEG':'Gral. Enrique Godoy','CRV':'Cervantes','CHK':'Chichinales','CCO':'Clte. Cordero',
  'CBE':'Cnel. Belisle','COM':'Comallo','CNI':'Cona Niyeu','DAR':'Darwin',
  'ELB':'El Bolsón','ELC':'El Cóndor','GMI':'Guardia Mitre','LPE':'Lago Pellegrini',
  'LBE':'Los Berros','LME':'Los Menucos','MQC':'Maquinchao','PLP':'Paraje Las Perlas',
  'PIL':'Pilcaniyeu','POM':'Pomona','PSE':'Puerto S.A.E.','RME':'Ramos Mexía',
  'RCH':'Río Chico','SJV':'San Javier','SCO':'Sierra Colorada','VRE':'Villa Regina',
  'NOR':'Ñorquinco','VDC':'Viedma Central','SAV':'Subg. Alto Valle',
  'SVE':'Subg. Alto Valle Este','SAN':'Subg. Andina','SAT':'Subg. Atlántica','SES':'Subg. Este'
};


// ══════════════════════════════════════════════════════════════════
//  GET — punto de entrada principal
// ══════════════════════════════════════════════════════════════════
function doGet(e) {
  const p      = e.parameter || {};
  const accion = p.accion || 'nomina';
  const rol    = p.rol    || 'admin';

  let res;
  try {
    if      (accion === 'nomina')   res = getNomina(p, rol);
    else if (accion === 'empleado') res = getEmpleado(p.legajo, rol);
    else if (accion === 'stats')    res = getStats();
    else if (accion === 'familias') res = { ok: true, data: FAMILIAS };
    else if (accion === 'sedes')    res = { ok: true, data: SEDES };
    else                            res = { ok: false, error: 'Acción no reconocida' };
  } catch (err) {
    res = { ok: false, error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(res))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Nómina con filtros ─────────────────────────────────────────────
function getNomina(p, rol) {
  const hoja  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA);
  const datos = hoja.getDataRange().getValues();

  const fFamilia = (p.familia || '').toUpperCase().trim();
  const fSede    = (p.sede    || '').toUpperCase().trim();
  const fEstado  = (p.estado  || '').toUpperCase().trim();
  const fLegajo  = (p.legajo  || '').trim();
  const fQ       = (p.q       || '').toLowerCase().trim();

  // Si no hay ningún filtro activo, devolver vacío (búsqueda bajo demanda)
  const hayFiltro = fFamilia || fSede || fEstado || fLegajo || fQ;
  if (!hayFiltro) return { ok: true, total: 0, data: [], vacio: true };

  const lista = [];

  for (let i = FILA_INICIO - 1; i < datos.length; i++) {
    const f = datos[i];
    if (!f[COL.CODIGO]) continue;

    const codigo   = str(f[COL.CODIGO]);
    const codComp  = str(f[COL.COD_COMPLETO]);
    const apellido = str(f[COL.APELLIDO]);
    const nombre   = str(f[COL.NOMBRE]);
    const sedeNom  = str(f[COL.SEDE]);
    const familia  = str(f[COL.FAMILIA]);
    const catServ  = str(f[COL.CAT_SERV]);
    const legajo   = str(f[COL.LEGAJO]);

    // Extraer familia del código (antes del guión — 3 o 4 letras)
    const famCode  = codigo.split('-')[0].toUpperCase();

    // Extraer código de sede del código completo (segundo segmento | )
    const partes   = codComp.split('|');
    const sedeCode = partes.length > 1 ? partes[1].trim().toUpperCase() : '';

    // Extraer nivel N (sin mostrar T ni ST)
    const nts        = partes.length > 2 ? partes[2].trim() : str(f[COL.CAT_NTS]);
    const nivelMatch = nts.match(/N\s*(\d+)/i);
    const nivel      = nivelMatch ? 'N' + nivelMatch[1] : '';

    // Normalizar estado
    const estadoRaw  = str(f[COL.ESTADO]).toUpperCase();
    const estadoNorm = ESTADOS_VALIDOS.includes(estadoRaw) ? estadoRaw : 'PENDIENTE';

    // ── Aplicar filtros ──
    if (fFamilia && famCode   !== fFamilia) continue;
    if (fSede    && sedeCode  !== fSede)    continue;
    if (fEstado  && estadoNorm !== fEstado) continue;
    if (fLegajo  && legajo    !== fLegajo)  continue;
    if (fQ) {
      const txt = `${apellido} ${nombre} ${codigo} ${sedeNom} ${legajo}`.toLowerCase();
      if (!txt.includes(fQ)) continue;
    }

    const emp = {
      codigo,
      legajo,
      apellido,
      nombre,
      apellido_nombre: apellido + ', ' + nombre,
      puesto:    familia || FAMILIAS[famCode] || famCode,
      sede:      sedeNom,
      sedeCode,
      sedeName:  SEDES[sedeCode] || sedeNom,
      familia:   famCode,
      familiaNombre: FAMILIAS[famCode] || familia,
      catServicio:   catServ,
      riesgo:        str(f[COL.RIESGO]),
      nivel_cct:     str(f[COL.FUNCION_CCT]),
      nivel,
      basico:        str(f[COL.BASICO]),
      estado:        estadoNorm,
      estado_relev:  estadoNorm,
      linkBorrador:  str(f[COL.LINK_BORRAD]),
      linkDefinitivo:str(f[COL.LINK_DEFIN]),
      dominio:       str(f[COL.DOMINIO]),
    };

    // Campos privados — solo admin y rrhh
    if (rol === 'admin' || rol === 'rrhh') {
      emp.transcripcion = str(f[COL.TRANSCRIPT]);
      emp.eneagrama     = str(f[COL.ENEAGRAMA]);
      emp.observacion   = str(f[COL.OBSERVACION]);
    }

    lista.push(emp);
  }

  return { ok: true, total: lista.length, data: lista };
}

// ── Un empleado por legajo ──────────────────────────────────────────
function getEmpleado(legajo, rol) {
  if (!legajo) return { ok: false, error: 'Falta el legajo' };
  const res = getNomina({ legajo }, rol);
  if (!res.ok || res.data.length === 0) return { ok: false, error: 'No encontrado' };
  return { ok: true, data: res.data[0] };
}

// ── Stats para Dashboard ───────────────────────────────────────────
function getStats() {
  const hoja  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA);
  const datos = hoja.getDataRange().getValues();

  const stats = {
    total: 0,
    porEstado:   { PENDIENTE: 0, ENTREVISTADO: 0, 'REVISIÓN': 0, COMPLETADO: 0 },
    porFamilia:  {},
    porSede:     {},
    porCat:      { CAT1: 0, CAT2: 0, CAT3: 0, CAT4: 0 },
  };

  for (let i = FILA_INICIO - 1; i < datos.length; i++) {
    const f = datos[i];
    if (!f[COL.CODIGO]) continue;
    stats.total++;

    const est = ESTADOS_VALIDOS.includes(str(f[COL.ESTADO]).toUpperCase())
      ? str(f[COL.ESTADO]).toUpperCase() : 'PENDIENTE';
    stats.porEstado[est] = (stats.porEstado[est] || 0) + 1;

    const fam = str(f[COL.CODIGO]).split('-')[0].toUpperCase();
    stats.porFamilia[fam] = (stats.porFamilia[fam] || 0) + 1;

    const partes = str(f[COL.COD_COMPLETO]).split('|');
    const sc = partes.length > 1 ? partes[1].trim().toUpperCase() : '';
    if (sc) stats.porSede[sc] = (stats.porSede[sc] || 0) + 1;

    const cat = str(f[COL.CAT_SERV]).replace(/\s/g,'').toUpperCase();
    if (stats.porCat[cat] !== undefined) stats.porCat[cat]++;
  }

  const relevados = stats.porEstado.ENTREVISTADO + stats.porEstado['REVISIÓN'] + stats.porEstado.COMPLETADO;
  stats.avancePct = stats.total > 0 ? Math.round((relevados / stats.total) * 100) : 0;
  stats.relevados = relevados;

  return { ok: true, data: stats };
}

// ══════════════════════════════════════════════════════════════════
//  POST — escritura desde la plataforma Angular
// ══════════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    let res;
    switch (body.accion) {
      case 'actualizarEstado':  res = actualizarEstado(body.legajo, body.estado); break;
      case 'actualizarLinks':   res = actualizarLinks(body.legajo, body.linkBorrador, body.linkDefinitivo); break;
      case 'guardarPrivados':   res = guardarPrivados(body.legajo, body.transcripcion, body.eneagrama, body.observacion); break;
      default: res = { ok: false, error: 'Acción no reconocida' };
    }
    return json(res);
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

function actualizarEstado(legajo, nuevoEstado) {
  if (!legajo || !nuevoEstado) return { ok: false, error: 'Faltan datos' };
  const est = nuevoEstado.trim().toUpperCase();
  if (!ESTADOS_VALIDOS.includes(est)) return { ok: false, error: 'Estado inválido: ' + est };
  return escribirCelda(legajo, COL.ESTADO, est);
}

function actualizarLinks(legajo, borrador, definitivo) {
  if (!legajo) return { ok: false, error: 'Falta legajo' };
  if (borrador   !== undefined) escribirCelda(legajo, COL.LINK_BORRAD, borrador);
  if (definitivo !== undefined) escribirCelda(legajo, COL.LINK_DEFIN,  definitivo);
  return { ok: true, legajo };
}

function guardarPrivados(legajo, transcripcion, eneagrama, observacion) {
  if (!legajo) return { ok: false, error: 'Falta legajo' };
  if (transcripcion !== undefined) escribirCelda(legajo, COL.TRANSCRIPT,  transcripcion);
  if (eneagrama     !== undefined) escribirCelda(legajo, COL.ENEAGRAMA,   eneagrama);
  if (observacion   !== undefined) escribirCelda(legajo, COL.OBSERVACION, observacion);
  return { ok: true, legajo };
}

// ── Helpers ────────────────────────────────────────────────────────
function str(v) { return v !== null && v !== undefined ? String(v).trim() : ''; }

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function escribirCelda(legajo, colIdx, valor) {
  const hoja  = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA);
  const datos = hoja.getDataRange().getValues();
  for (let i = FILA_INICIO - 1; i < datos.length; i++) {
    if (str(datos[i][COL.LEGAJO]) === str(legajo)) {
      hoja.getRange(i + 1, colIdx + 1).setValue(valor);
      return { ok: true, legajo };
    }
  }
  return { ok: false, error: 'Legajo no encontrado: ' + legajo };
}