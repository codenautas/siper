
# Documentación del Procedimiento `siper.procesar_fichadas`

## Índice de Contenidos

- [Documentación del Procedimiento `siper.procesar_fichadas`](#documentación-del-procedimiento-siperprocesar_fichadas)
  - [Índice de Contenidos](#índice-de-contenidos)
  - [1. Descripción General del Procedimiento](#1-descripción-general-del-procedimiento)
    - [Definición](#definición)
  - [2. Estructura de Parámetros (IN/OUT)](#2-estructura-de-parámetros-inout)
  - [2.1. JSON de Entrada (p\_data\_json)](#21-json-de-entrada-p_data_json)
    - [Claves Raíz del JSON de Entrada](#claves-raíz-del-json-de-entrada)
    - [Estructura de cada Objeto Fichada (Dentro de "fichadas")](#estructura-de-cada-objeto-fichada-dentro-de-fichadas)
  - [2.2. JSON de Salida (p\_resultado - OUT)](#22-json-de-salida-p_resultado---out)
  - [3. Códigos de Estado y Errores](#3-códigos-de-estado-y-errores)
  - [4. Ejemplo de Uso y Llamada](#4-ejemplo-de-uso-y-llamada)
    - [4.1. JSON de Entrada de Ejemplo (p\_data\_json)](#41-json-de-entrada-de-ejemplo-p_data_json)
    - [4.2. Invocación SQL](#42-invocación-sql)
  - [5. Ejemplos de Respuesta](#5-ejemplos-de-respuesta)
    - [5.1. Éxito Completo (200)](#51-éxito-completo-200)
    - [5.2. Éxito Parcial (207)](#52-éxito-parcial-207)
    - [5.3. Error de Configuración (403)](#53-error-de-configuración-403)
    - [5.4. Error Estructural (400)](#54-error-estructural-400)
    - [5.5. Error Total Lógico (500)](#55-error-total-lógico-500)

---

## 1. Descripción General del Procedimiento

Este procedimiento almacenado está diseñado para **recibir registros de fichadas** en formato **JSONB** y procesarlos en un entorno transaccional con una estrategia de **Best-Effort** (el fallo de un registro individual no detiene el procesamiento del lote). Su función principal es validar, transformar e insertar cada registro en la tabla de fichadas del sistema, independientemente del éxito o fracaso de los registros adyacentes. **Importante:** El procedimiento es **transaccional** y debe ser confirmado mediante un `COMMIT` explícito.

### Definición

```
siper.procesar_fichadas(
    p_data_json   IN  jsonb,
    p_resultado   OUT jsonb
);
```

---

## 2. Estructura de Parámetros (IN/OUT)

A continuación, se detallan los parámetros requeridos para ejecutar el procedimiento:

| Parámetro | Dirección | Tipo SQL | Obligatorio | Descripción |
| --- | --- | --- | --- | --- |
| `p_data_json` | `IN` | `jsonb` | Sí | El objeto JSON principal que encapsula los datos a procesar, incluyendo el array de fichadas y metadatos opcionales. |
| `p_resultado` | `OUT` | `jsonb` | Sí | Objeto JSON de salida que contendrá el resumen de la ejecución, estadísticas y el detalle de los registros fallidos. |

---

## 2.1. JSON de Entrada (p_data_json)

Este es el esquema que debe seguir el objeto **IN** `p_data_json`. Debe contener metadatos para trazabilidad y, obligatoriamente, el array de registros de fichadas.

### Claves Raíz del JSON de Entrada

| Clave Raíz | Tipo | Obligatorio | Descripción |
| --- | --- | --- | --- |
| `"fichadas"` | `jsonb[]` | **Sí** | **Array principal** que contiene todos los objetos de fichadas individuales para el procesamiento por lote. |
| `"machine_id"` | `TEXT` | No | Identificador del dispositivo físico o sistema de origen que generó el lote (Default: `UNKNOWN_MACHINE`). |
| `"navigator"` | `TEXT` | No | Información detallada del cliente o navegador de conexión para fines de auditoría (Default: `UNKNOWN_NAV`). |

### Estructura de cada Objeto Fichada (Dentro de "fichadas")

| Clave | Tipo Esperado | Obligatorio | Descripción |
| --- | --- | --- | --- |
| `"idper"` | `TEXT` | Sí | **Identificador único de la persona** asociada al registro. |
| `"tipo fichada"` | `TEXT` | Sí | Clasificación del evento de fichada (ej: "ENTRADA", "SALIDA"). |
| `"fecha"` | `DATE` (string) | Sí | Fecha del evento de fichada. **Formato obligatorio: "YYYY-MM-DD"**. |
| `"hora"` | `TIME WITH TZ` (string) | Sí | Hora del evento, incluyendo la zona horaria. **Formato obligatorio: "HH:MM:SS-03"**. |
| `"id_original"` | `TEXT` | Sí | **Identificador único** del registro en el sistema fuente para evitar duplicidad. |
| `"observaciones"` | `TEXT` | No | Comentarios. |
| `"punto"` | `TEXT` | No | Identificador del punto físico o lógico donde se realizó la fichada. |
| `"tipo_dispositivo"` | `TEXT` | No | Categoría del dispositivo (ej: "MOVIL", "LECTOR_BIOMETRICO"). |

---

## 2.2. JSON de Salida (p_resultado - OUT)

El objeto JSON de salida proporciona un resumen estadístico del lote y el detalle exacto de las fallas encontradas.

| Clave | Tipo | Descripción |
| --- | --- | --- |
| `"status"` | `TEXT` | Estado de alto nivel que indica el resultado de la operación: **OK**, **SUCCESS_PARTIAL**, o **ERROR**. |
| `"code"` | `INTEGER` | Código de estado (similar a HTTP): **200**, **207**, **400**, **403**, **500**. |
| `"message"` | `TEXT` | Mensaje descriptivo conciso del resultado de la ejecución. |
| `"cant_procesadas"` | `INTEGER` | Cantidad total de registros de fichadas recibidos en el array `"fichadas"`. |
| `"cant_insertadas"` | `INTEGER` | Cantidad de registros que cumplieron todas las validaciones y se insertaron con éxito. |
| `"cant_fallidas"` | `INTEGER` | Cantidad de registros que generaron un fallo de inserción o validación. |
| `"fallidas"` | `JSONB[]` | **Array Detalle:** Contiene la información de cada registro fallido junto con el error SQL o de validación asociado. Vacío si `cant_fallidas` es cero. |

---

## 3. Códigos de Estado y Errores

A continuación se detallan los posibles códigos de estado y errores. Tal como se mencionó, el procedimiento utiliza la lógica **Best-Effort** para gestionar fallos individuales sin abortar toda la transacción. Sin embargo, para errores críticos (códigos **400, 403, 500**), el procesamiento se detiene y se rechaza todo el lote.

| Condición | status | code | message | cant_proc. | cant_insert. | cant_fall. | fallidas (JSONB) |
|---|---:|---:|---|---:|---:|---:|---|
| Éxito Total: Lote válido y 0 fallos. | `OK` | 200 | "Lote procesado con éxito." | N | N | 0 | `[]` |
| Éxito Parcial: 1 o más fallos. | `SUCCESS_PARTIAL` | 207 | "Lote procesado con fallos..." | N | N menos cant_fall. | > 0 | `[...]` |
| Error Estructural: JSON inválido o 'fichadas' ausente/no-array. | `ERROR` | 400 | "Fallo en el formato de entrada." | 0 | 0 | 0 | `[]` |
| Error Configuración: Carga deshabilitada por tabla 'parametros'. | `ERROR` | 403 | "La funcionalidad de procesamiento de fichadas se encuentra deshabilitada." | N | 0 | 0 | `[]` |
| Error Lógico Total: Todas las fichadas fallaron la inserción. | `ERROR` | 500 | "Error fatal de procesamiento: Todas las fichadas del lote fallaron." | N | 0 | N | `[...]` |

---

Aclaración: N es la cantidad de fichadas enviadas

## 4. Ejemplo de Uso y Llamada

### 4.1. JSON de Entrada de Ejemplo (p_data_json)

```json
{
  "machine_id": "SERVER_PROD_10",
  "navigator": "PostgreSQL Client",
  "fichadas": [
    {
      "idper": "EMP9001",
      "tipo fichada": "ENTRADA",
      "fecha": "2025-10-14",
      "hora": "09:00:00-03",
      "id_original": "WEB1001",
      "punto": "Oficina Central"
    },
    {
      "tipo fichada": "SALIDA",
      "fecha": "2025-10-14",
      "hora": "17:00:00-03",
      "id_original": "WEB1002",
      "observaciones": "Fichada por olvido."
    }
  ]
}
```

### 4.2. Invocación SQL

```sql
DO $$
DECLARE
    json_in jsonb := '{
        "machine_id": "SERVER_PROD_10",
        "navigator": "PostgreSQL Client",
        "fichadas": [
            {
                "idper": "EMP9001",
                "tipo fichada": "ENTRADA",
                "fecha": "2025-10-14",
                "hora": "09:00:00-03",
                "id_original": "WEB1001",
                "punto": "Oficina Central"
            },
            {
                "tipo fichada": "SALIDA",
                "fecha": "2025-10-14",
                "hora": "17:00:00-03",
                "id_original": "WEB1002"
            }
        ]
    }';
    json_out jsonb;
BEGIN
    CALL siper.procesar_fichadas(json_in, json_out);
    RAISE NOTICE 'Resultado de Procesamiento: %', json_out;
    COMMIT;
END $$;
```

---

## 5. Ejemplos de Respuesta

### 5.1. Éxito Completo (200)

```json
{
  "status": "OK",
  "code": 200,
  "message": "Lote procesado con éxito.",
  "cant_procesadas": 2,
  "cant_insertadas": 2,
  "cant_fallidas": 0,
  "fallidas": []
}
```

### 5.2. Éxito Parcial (207)

```json
{
  "status": "SUCCESS_PARTIAL",
  "code": 207,
  "message": "Lote procesado con fallos. Revise "fallidas" y end_status de bitácora.",
  "cant_procesadas": 2,
  "cant_insertadas": 1,
  "cant_fallidas": 1,
  "fallidas": [
    {
      "index": 2,
      "error_code": "23502",
      "error_message": "ERROR: valor nulo en columna «idper» de la relación «fichadas» viola la restricción no nula",
      "fichada_data": {
        "tipo fichada": "SALIDA",
        "fecha": "2025-10-14",
        "hora": "17:00:00-03",
        "id_original": "WEB1002"
      }
    }
  ]
}
```

### 5.3. Error de Configuración (403)

```json
{
  "status": "ERROR",
  "code": 403,
  "message": "La funcionalidad de procesamiento de fichadas se encuentra deshabilitada.",
  "cant_procesadas": 2,
  "cant_insertadas": 0,
  "cant_fallidas": 0,
  "fallidas": []
}
```

### 5.4. Error Estructural (400)

```json
{
  "status": "ERROR",
  "code": 400,
  "message": "Fallo en el formato de entrada.",
  "cant_procesadas": 0,
  "cant_insertadas": 0,
  "cant_fallidas": 0,
  "fallidas": []
}
```

### 5.5. Error Total Lógico (500)

```json
{
  "status": "ERROR",
  "code": 500,
  "message": "Error fatal de procesamiento: Todas las fichadas del lote fallaron.",
  "cant_procesadas": 5,
  "cant_insertadas": 0,
  "cant_fallidas": 5,
  "fallidas": [
    {
      "index": 1,
      "error_code": "23505",
      "error_message": "ERROR: llave duplicada viola restricción de unicidad 'id_original_key'",
      "fichada_data": { /* ... */ }
    }
  ]
}
```
---
