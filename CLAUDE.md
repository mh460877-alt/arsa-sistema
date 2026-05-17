# ARSA Sistema — Contexto del proyecto

## Qué es
Plataforma para la **actualización de descriptivos de puesto** de Aguas Rionegrinas S.A. (ARSA), empresa de agua estatal de Río Negro. Alcance: **859 empleados**, ~70 puestos, 4 meses. Ejecuta Escencial Consultora.

Última actualización de descriptivos en ARSA: 2007. Por eso el proyecto.

## Stack

- **Frontend:** Angular 21 standalone components, signals + computed, rutas lazy con `loadComponent`, sin Material/Bootstrap (CSS propio).
- **Backend:** Google Apps Script + Google Sheets (8 pestañas: `Usuarios`, `Nomina`, `Nomina_Raw`, `Relevamiento`, `Descriptivos`, `Procedimientos`, `Puestos`, `Sede`).
- **Auth:** `localStorage` con `{ rol, nombre, ... }` + guards por rol. Sin token todavía (ver "Pendientes de seguridad" abajo).
- **Patrón API:** `GET` con `HttpParams` para lecturas, `POST` con `fetch` y `Content-Type: text/plain` para escrituras (evita el 302 redirect de Apps Script).

## URL del Apps Script en producción

```
https://script.google.com/macros/s/AKfycbzte9JEZnK8pe6E_fOUNrwCxfZpCy6RLb0jNcrMpKVUE0_kAeczgmM0VCxpZq2WWRn4pg/exec
```

Está en `src/app/services/api.ts`, propiedad `private url`.

Si hay que volver a desplegar el Apps Script: **Implementar → Gestionar implementaciones → editar → Nueva versión**. La URL no cambia.

## Roles

| Rol | Ve | Edita |
|---|---|---|
| `admin` | Todo el sistema | Todo, incluyendo publicar descriptivos |
| `rrhh` | Todo incluyendo campos privados (transcripción/eneagrama/observación) | Solo lectura — los campos privados los carga desde Sheets directamente |
| `gerente` | Lectura por área, sin Relevamiento, sin campos privados | No |
| `empleado` | Solo su propio descriptivo en `/mi-descriptivo` | No |

El **consultor (equipo Escencial)** NO tiene usuario en el sistema — trabaja directo desde Google Sheets.

## Estado actual de módulos

| Módulo | Ruta | Estado |
|---|---|---|
| Login | `/login` | Listo |
| Layout (sidebar + topbar + router-outlet) | — | Listo, menús por rol (`menuAdmin`, `menuRrhh`, `menuGerente`) |
| Dashboard | `/dashboard` | Esqueleto con KPIs vacíos — falta conectar a `stats` reales del Apps Script |
| Nómina | `/nomina` | **Listo.** Búsqueda bajo demanda con 4 filtros: texto (nombre/legajo, dispara con lupa o Enter), Sede, Familia, Estado. Memoria de última búsqueda al volver al módulo. |
| Relevamiento | `/relevamiento` | **Listo.** Estados con dropdown editable, links borrador (col S) y definitivo (col T), fila expandible con transcripción/eneagrama/observación (solo `admin`+`rrhh`), badge de rol, lógica de publicación automática al pasar a `COMPLETADO` con link definitivo, bloqueo si intenta completar sin link. |
| Descriptivos | `/descriptivos` | **Pendiente.** Cards por familia de puesto con vinculación a procedimientos. |
| Procedimientos | `/procedimientos` | **Pendiente.** Biblioteca con ID + nombre + documento, asignable a uno o varios puestos. Roles asignables: Responsable · Corresponsable · Participa · Aprueba · Supervisa · Ejecuta · Dictamina. |
| Organigrama | `/organigrama` | **Pendiente.** Dos vistas (con nombres y sin nombres). Complejo de mantener, dejar para fase posterior. |
| Usuarios | `/usuarios` | **Pendiente.** Solo `admin`. Alta/baja/modificación + alta masiva por CSV. |
| Mi Descriptivo | `/mi-descriptivo` | **Pendiente.** Vista del empleado: nombre del puesto (sin nombre/apellido propio), misión, funciones, a quién reporta, quién le reporta, sede, procedimientos relacionados, descarga PDF. |
| Capacitación | — | **Bloqueado por diseño** hasta que ARSA apruebe y pague. El espacio existe en el menú con candado. |

## Estados de relevamiento

4 valores normalizados que espera el frontend:
- `PENDIENTE`
- `ENTREVISTADO`
- `REVISIÓN`
- `COMPLETADO`

La función `normalizarEstado()` en el Apps Script traduce:
- Nomenclador (col P): `PENDIENTE` / `ENTREVISTADO` / `PRESENTADO A RRHH` / `COMPLETADO`
- Hoja Relevamiento: `Agendada` / `En proceso` / `Completada` / `En revisión`

→ al vocabulario del frontend. Si una celda tiene un nombre de persona (legacy: Robles, Gentile, etc.) o está vacía, se devuelve `PENDIENTE`.

## Flujo de aprobación de descriptivos

```
ENTREVISTADO  → Laura/Escencial carga link borrador (col S)
       ↓
REVISIÓN      → Subgerente RRHH revisa, deja observación si hay correcciones
       ↓
   ¿Aprobado?
       ├── SÍ → Admin carga link definitivo (col T) + estado a COMPLETADO
       │         → automáticamente publicado en Descriptivos
       └── NO → vuelve a REVISIÓN con observación visible para que Laura rehaga
```

El sistema bloquea pasar a `COMPLETADO` sin link definitivo cargado.

## Reglas duras del proyecto (NO romper)

1. **Lenguaje con empleados y sindicato:** NUNCA usar "evaluación de desempeño", "KPIs", "convenio colectivo", "ley de contrato". Solo "actualización de descriptivos de puesto". Aplica a UI, textos, mensajes, mocks.
2. **El empleado ve solo SU PUESTO**, no sus datos personales. En el descriptivo público no aparece nombre ni apellido — solo "Operario de Agua Potable, Bariloche" y descripción del puesto.
3. **T1/T2 (tramo/subtramo)** no se muestra en la nómina pública por ahora. Se usa internamente para calcular básico salarial pero queda oculto.
4. **Campos privados** (transcripción, eneagrama, observación) solo visibles para `admin` y `rrhh`. Nunca al `gerente` ni al `empleado`.
5. **Identificadores de familia** pueden ser de 3 o 4 letras antes del guión (ADM-001, PROF-001, OPA-001). El parser usa "todo lo que está antes del primer `-`".

## Datos de referencia del nomenclador

- **859 empleados** totales
- **13 familias:** OPA (223), ADM (138), AYC (137), OPC (68), TEC (59), EM (72), JEF (45), CAP (29), COM (27), PROF (27), GER (19), OTR (12), PAS (3)
- **47 sedes** con códigos de 3 letras (VDC = Viedma Central, BRC = Bariloche, etc.)

Estructura del código completo: `ADM-001 | GEG | N3-T5-ST1`
- `ADM` = familia
- `GEG` = sede
- `N3-T5-ST1` = nivel-tramo-subtramo

## Branding ARSA

| Color | Hex | Uso |
|---|---|---|
| Azul Profundo | `#0A2E4A` | Fondos principales, headers |
| Azul Río Negro | `#1A5F8A` | Navegación, títulos |
| Agua Clara | `#4BAED4` | Acento, CTAs, highlights (headers de tabla) |
| Celeste Cielo | `#A8D8EA` | Fondos claros, banners |
| Verde Patagonia | `#2D7D5A` | Sustentabilidad, mensajes positivos, "Publicado" |
| Verde Claro | `#5AB88A` | Iconografía ambiental |
| Arena Rionegrina | `#E8D5B0` | Secundario cálido |

## Patrones de código a respetar

- **Componentes nuevos:** standalone (`standalone: true`), `signal()` para estado reactivo, `computed()` para derivados.
- **Llamadas a API:** usar `ApiService` de `src/app/services/api.ts` (no `fetch` directo en componentes — mantener consistencia con Nómina y Relevamiento).
- **Routing:** `loadComponent` con import dinámico en `app.routes.ts`. Las rutas ya están registradas para todos los módulos pendientes.
- **Estilos:** CSS por componente, sin estilos globales nuevos salvo casos justificados en `styles.css`.
- **Mensajes y labels:** español de Argentina, sin emojis (salvo los ya presentes en el nomenclador como 🏛️ SEDE CENTRAL).
- **Mockup data:** evitar nombres propios. Usar "Operario", "Jefatura", etc.

## Workflow git

Branch principal: `main`. Repo: `mh460877-alt/arsa-sistema`.

Commits pequeños y descriptivos en español:
```bash
git add .
git commit -m "feat(descriptivos): cards por familia con vínculo a procedimientos"
git push
```

Antes de empezar a editar, siempre `git status` y `git pull` para evitar conflictos con cambios hechos desde otra máquina.

## Cómo arranca el dev local

```bash
npm install        # solo la primera vez
ng serve           # http://localhost:4200
```

Usuarios demo (Sheets `Usuarios`):
- `admin` / `admin`
- `rrhh` / `rrhh`
- `empleado` / `empleado`

## Pendientes de seguridad (no urgentes pero anotados)

1. El `authGuard` valida solo presencia de `usuario` en localStorage. El Apps Script no pide token, así que cualquiera con la URL podría llamar a la API directo. Agregar token de sesión en algún momento.
2. Las contraseñas en `Usuarios` están en texto plano. Hashearlas (al menos SHA-256 con salt) cuando se implemente el módulo de Usuarios.
3. CORS abierto a "Cualquier persona" en la implementación del Apps Script. OK para desarrollo, revisar antes de producción.

## Próximos pasos sugeridos (orden de prioridad)

1. **Módulo Descriptivos** — cards por familia, vínculo con procedimientos, estado de publicación
2. **Módulo Procedimientos** — alta/edición + asignación a puestos
3. **Vista Mi Descriptivo** — pantalla del empleado con descarga PDF
4. **Conectar Dashboard real** — `stats` y `statsHistorico` ya existen en el Apps Script, falta consumirlos
5. **Módulo Usuarios** — admin only
6. **Botón "Ver" en Nómina** — abrir detalle del empleado

## Archivos clave para orientarse

- `src/app/app.routes.ts` — todas las rutas y guards
- `src/app/services/api.ts` — único punto de llamada al backend
- `src/app/pages/layout/layout.ts` — menús por rol
- `src/app/pages/nomina/` — referencia de búsqueda bajo demanda
- `src/app/pages/relevamiento/` — referencia de fila expandible + permisos por rol
- `apps-script.gs` (en Google) — backend completo

## Glosario rápido

- **Nomenclador:** el Excel maestro con los 859 empleados codificados, fuente de verdad de la nómina
- **Descriptivo:** documento que describe un puesto (misión, funciones, dependencia, procedimientos relacionados)
- **Relevamiento:** el proceso de entrevistar empleados para armar los descriptivos
- **Familia:** agrupación de puestos similares (ej: ADM = administración)
- **Sede:** localidad/oficina donde está el empleado
- **CCT 130/75:** convenio colectivo de trabajo de empleados de comercio (NO mencionar a empleados/sindicato)

## Convención de commits
Sin línea de `Co-Authored-By` en los mensajes salvo que se pida explícitamente. Conventional Commits estándar (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
