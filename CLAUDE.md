# CLAUDE.md — siper

Sistema de manejo de personal desarrollado en Node.js con backend-plus como framework base.
Versión actual: **0.7.0-rc** .

---

## Estructura de archivos

Las tablas están definidas siguiendo la convención de `backend-plus`: cada tabla tiene su propio archivo con el prefijo `tabla-`, ubicado en `src/server/`. El frontend en `src/client` y en `src/common` lo que sea común a ambos.

Ejemplos:
- `src/server/table-cod_novedades.ts` — definición de `cod_novedades`
- `src/server/table-novedades_registradas.ts` — definición de `novedades_registradas`
- etc.

> 📝 Antes de trabajar con cualquier tabla, leer su archivo `tabla-*.ts` correspondiente. Ahí están los nombres exactos de columnas, labels, descripciones y cualquier lógica de validación definida a nivel de tabla.

---

## Arquitectura general

`siper` es una aplicación web de gestión de personal que cubre:

- **Novedades** (presencias y ausencias): registro por rango de fechas, con tipo de novedad (vacaciones, día personal, licencia médica, etc.)
- **Fichadas**: registro de entrada/salida del personal
- **Parte diario**: reporte clave que consolida el estado del personal en un día dado
- **Calendario personal**: vista React por usuario que muestra sus novedades en un mes. Es usada por el personal de Recursos Humanos para cargar las novedades de los empleados.

### Stack

- **Backend**: Node.js + TypeScript, usando `backend-plus` como framework base (autenticación, tablas, procedimientos, API REST)
- **Frontend**: dos capas
  - Pantallas estándar generadas por backend-plus (HTML/JS "CRUDs con grillas edditables")
  - Pantalla principal en **React** (calendario personal de novedades)
- **Base de datos**: PostgreSQL, esquema `siper` (dos usuarios de db: `siper_owner` con el que se crean las tablas y SP; y `siper_admin` que es el que usa el backend para acceder a los datos)
- **Deploy**: servicio systemd en Ubuntu. Los desarrolladores pueden usar Windows también. 

---

## Convenciones de código

- **Todos los tipos deben ser explícitos**. Prohibido usar `any`, casts vía `unknown`, o cualquier magia sin justificación. A veces se usa [guarantee-type](https://github.com/emilioplatzer/guarantee-type) para parsear tipos (similar a zod).
- Si existe código de bajo nivel inevitablemente sin tipado estricto, debe estar estrictamente encapsulado en ubicaciones muy delimitadas y tratado como excepción, no como norma.
- **Preservar el estilo existente** al modificar archivos: incluyendo el uso de `var` donde ya se usa.
- Los nombres de tablas, columnas y variables de dominio van **en castellano**, consistente con el esquema de base de datos.
- El código sigue las convenciones de `backend-plus` para definición de tablas, procedimientos y endpoints.

---

## Contexto de base de datos — esquema `siper`

Todos los objetos pertenecen al esquema `siper`. Los nombres están en castellano.

### Entidades principales

| Tabla | Descripción |
|---|---|
| `personas` | Tabla central del personal. La pk es `idper` que es un string construido con las dos primeras letras del apellido y un número |
| `parametros` | Parámetros globales del sistema. Siempre tiene un único registro. Incluye: cantidad de horas diarias esperadas por persona, y el campo `fecha_hora_para_test` usado para mockear la fecha/hora actual en tests. |
| `novedades_registradas` | Registro de novedades por rango de fechas (desde/hasta). PK: `persona` + `idr` (autonumérico). Funciona en capas: se puede registrar una novedad encima de otra ya existente para el mismo rango. La novedad vigente para cada fecha se determina tomando la última registrada (mayor `idr`) entre todas las que cubren esa fecha. **Solo escritura por usuarios/sistema; nunca modificar registros existentes.** (se peuden borrar registros si la fecha desde es en el futuro). |
| `novedades_vigentes` | Una fila por persona por fecha (PK: `fecha`, `idper`). El código de novedad es un atributo que depende funcionalmente de esa clave — cada persona tiene como máximo una novedad vigente por fecha. **Generada automáticamente, nunca se modifica directamente.** |
| `cod_novedades` | Un registro por cada código de novedad. Define el comportamiento de cada novedad en el sistema mediante campos booleanos (ver detalle abajo). |
| `fichadas_recibidas` | Eventos crudos del sistema externo. Una persona puede tener múltiples eventos de entrada o salida para la misma fecha sin control de duplicados. |
| `fichadas` | Fichadas consolidadas a partir de `fichadas_recibidas`. |
| `fichadas_vigentes` | Una fila por persona por fecha. Usa el tipo `timerange` de PostgreSQL para representar el rango horario válido de la fichada (de qué hora a qué hora). Impacta en `novedades_vigentes`. **Evolución planificada:** migrar a `tsmultirange` para soportar horario partido (ej: 8-12 y 14-16) o ausencias parciales con reintegro. No anticipar este cambio sin coordinación explícita. |

### Regla crítica: `novedades_vigentes`

> ⚠️ **`novedades_vigentes` nunca debe modificarse manualmente.**
> Es generada y mantenida automáticamente por unos triggers/y funciones especiales a partir de `novedades_registradas` y de `fichadas_vigentes`.
> Cualquier modificación directa sobre esta tabla rompe la integridad del sistema.

**Lógica de resolución (last write wins):** para una persona y fecha dada, pueden existir múltiples registros en `novedades_registradas` cuyos rangos se superpongan. La novedad vigente es la del registro con mayor `idr` (el último cargado). Esto permite "pisar" una novedad existente con una nueva sin borrar el historial.

Ejemplo:
- Se registra vacaciones del 1/1 al 30/1 → `idr=10`
- Se registra licencia por enfermedad del 20/1 al 2/2 → `idr=11`
- Resultado: del 1/1 al 19/1 rige vacaciones (idr=10), del 20/1 al 2/2 rige licencia (idr=11)

**`novedades_registradas` es append-only**: nunca se modifican registros existentes, solo se insertan nuevos.
Se pueden borrar registros cuyas fechas sean futuras. 

### Tabla `cod_novedades` — configuración de comportamiento

Cada código de novedad tiene una serie de campos booleanos que determinan cómo se comporta en el sistema. Esta tabla tiene descripciones por campo definidas en la propia estructura de la tabla (además del label).

Ejemplo de campos booleanos conocidos:

| Campo | Descripción |
|---|---|
| `requiere_fichadas` | La novedad es válida solo si existe fichada de entrada y salida |
| `pierde_presentismo` | La persona pierde el presentismo cuando tiene esta novedad |

> 📝 Esta tabla es de configuración. No se debeescribir lógica que dependa del código de la novedad `cod_nov` siempre hay que depender de los campos booleanos de `cod_novedades`. O sea no hardcodear reglas por código de novedad. En los casos de prueba sí se pueden utilizar códigos en base a un ejemplo de posible configuración de `cod_novedades` que está en `install/cod_novedades.tab`

### Flujo de datos

```
novedades_registradas  ──trigger──►  novedades_vigentes
                                             ▲
fichadas_recibidas  ──consolidación──►  fichadas  ──►  fichadas_vigentes (timerange por persona/fecha)  ──trigger──►  novedades_vigentes
```

### Reportes

- **Parte diario**: reporte principal que consolida el estado del personal para una fecha dada, basado en `novedades_vigentes`.
- **Calendario personal**: vista por usuario de sus novedades, implementada en React consumiendo la API de backend-plus.

---

## Casos de prueba

Los tests cubren ampliamente el registro de novedades, fichadas y otras funcionalidades críticas del sistema.

### Framework y comando

- **Framework**: Mocha + should
- **Comando**: `npm run tests`
- **Archivo principal**: `test.ts` (contiene tanto los casos de prueba como todos los helpers)

### Helpers disponibles

Los tests usan helpers dedicados para evitar boilerplate. Antes de escribir un test nuevo, revisar `test.ts` para ver qué helpers ya existen. Los más importantes:

| Helper | Descripción |
|---|---|
| `enNuevaPersona(nombre_test, opciones, callback)` | Crea una persona de test nueva y con algunos datos típicos (modificables por el parámetro opciones) y un callback donde se ejecutan las acciones (registros de noveadades, o lo que sea) y los asserts. Todos los tests son independientes gracias a este patrón. |
| `registrarNovedad(...)` | Inserta una novedad en `novedades_registradas` con los parámetros habituales, sin repetir boilerplate. |
| `registrarFichada(...)` | Inserta una fichada en `fichadas_recibidas` con los parámetros habituales, sin repetir boilerplate. |

Para mockear la fecha actual en un test, actualizar directamente el campo `fecha_hora_para_test` de la tabla `parametros` vía SQL (no existe un helper dedicado para esto).

> 📝 Si un test nuevo necesita una operación repetitiva que no tiene helper, agregar el helper en `test.ts` antes de usarlo — no inline en el caso de prueba.

### Lógica de negocio en PostgreSQL

Las reglas de negocio críticas están implementadas como **funciones almacenadas y triggers en PostgreSQL**, no en el backend Node.js. Esto es una decisión arquitectónica deliberada: garantiza que esas reglas no puedan saltearse aunque alguien modifique el backend.

Ejemplos de lógica que vive en la base de datos:
- Generación automática de `novedades_vigentes` a partir de `novedades_registradas` (trigger)
- Impacto de `fichadas_vigentes` en `novedades_vigentes` (trigger)
- Las funciones `fecha_actual()` y `fecha_hora_actual()` que abstraen el `CURRENT_DATE` / `CURRENT_TIMESTAMP`

> ⚠️ Si Claude Code necesita entender o modificar una regla de negocio importante, debe buscar primero si existe una función o trigger en PostgreSQL que la implemente — no asumir que toda la lógica está en TypeScript. Reimplementar en el backend lógica que ya existe en la base de datos introduce duplicación y riesgo de inconsistencia.

> 📝 Reglas generales para tests: usar `enNuevaPersona` para aislar el estado.
- No modificar helpers existentes sin revisar el impacto en los tests que los usan.
- Los helpers adicionales específicos de una sección pueden definirse localmente dentro de esa sección en `test.ts`.



### Control horario
Se está desarrollando un módulo de control horario que, a partir de las fichadas consolidadas en `fichadas_vigentes` y los parámetros de `parametros` (ej: horas diarias esperadas), calculará:
- Horas trabajadas por persona por día
- Promedios por semana y por mes
- Desvíos respecto al horario esperado

Esto se expondrá como reportes. La fuente de datos es `fichadas_vigentes` (con su `timerange`, o eventualmente `tsmultirange`).

### Multirange en fichadas
Ver nota en tabla `fichadas_vigentes` — migración planificada de `timerange` a `tsmultirange` para soportar horario partido y ausencias parciales con reintegro.
