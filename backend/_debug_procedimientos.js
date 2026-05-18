// ══════════════════════════════════════════════════════════════════
//  Helper TEMPORAL para inspeccionar la pestaña de procedimientos.
//  Borrar este archivo después de que diseñemos las funciones reales.
//
//  Cómo correrlo:
//    1) clasp push (sube este archivo al editor)
//    2) Abrir el editor de Apps Script desde el Sheets
//    3) Seleccionar "inspeccionarProcedimientos" del dropdown
//    4) Run → autorizar si pide → ver el output en Ejecuciones / Logs
//    5) Copiar el contenido del Logger y pasárselo a Claude Code
// ══════════════════════════════════════════════════════════════════

function inspeccionarProcedimientos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const nombreEsperado = 'NOMENCLADOR DE PROCESOS — ARSA';
  const sheet = ss.getSheetByName(nombreEsperado);

  if (!sheet) {
    Logger.log('Pestaña "' + nombreEsperado + '" no encontrada. Pestañas disponibles:');
    ss.getSheets().forEach(function(s) {
      Logger.log('  · "' + s.getName() + '"  (' + s.getName().length + ' chars)');
    });
    return;
  }

  Logger.log('Pestaña encontrada: "' + sheet.getName() + '"');
  Logger.log('Filas totales: ' + sheet.getLastRow() + ' · columnas: ' + sheet.getLastColumn());
  Logger.log('— Primeras 10 filas (raw) —');

  const filasAMostrar = Math.min(10, sheet.getLastRow());
  if (filasAMostrar === 0) { Logger.log('(sin filas)'); return; }

  const data = sheet.getRange(1, 1, filasAMostrar, sheet.getLastColumn()).getValues();
  data.forEach(function(row, i) {
    Logger.log('Fila ' + (i + 1) + ': ' + JSON.stringify(row));
  });
}
