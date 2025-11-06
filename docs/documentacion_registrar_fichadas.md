# Documentación de la Función `siper.registrar_fichadas`

## Índice de Contenidos

- [Documentación de la Función `siper.registrar_fichadas`](#documentación-de-la-función-siperregistrar_fichadas)
  - [Índice de Contenidos](#índice-de-contenidos)
  - [1. Descripción General de la Función](#1-descripción-general-de-la-función)
    - [Definición](#definición)
  - [2. Parámetro de Entrada y Salida de la funcion](#2-parámetro-de-entrada-y-salida-de-la-funcion)
  - [2.1. Texto de Entrada (`p_data_json_text`)](#21-texto-de-entrada-p_data_json_text)
    - [Estructura de cada Objeto Fichada](#estructura-de-cada-objeto-fichada)
  - [2.2. JSON de Salida](#22-json-de-salida)
  - [3. Códigos de Estado y Errores](#3-códigos-de-estado-y-errores)
  - [4. Ejemplo de Uso y Llamada](#4-ejemplo-de-uso-y-llamada)
    - [4.1. JSON de Entrada de Ejemplo](#41-json-de-entrada-de-ejemplo)
    - [4.2. Invocación SQL](#42-invocación-sql)
  - [5. Ejemplos de Respuesta](#5-ejemplos-de-respuesta)
    - [5.1. Éxito Completo (200)](#51-éxito-completo-200)
    - [5.2. Éxito Parcial (207)](#52-éxito-parcial-207)
    - [5.3. Error de Configuración (403)](#53-error-de-configuración-403)
    - [5.4. Error Estructural (400)](#54-error-estructural-400)
    - [5.5. Error Total Lógico (500)](#55-error-total-lógico-500)

---

## 1. Descripción General de la Función

La función `siper.registrar_fichadas` está diseñada para **recibir registros de fichadas** en formato **JSON serializado (TEXT)**, procesarlos y almacenarlos en la base de datos.  
Implementa una estrategia **Best-Effort**, donde el fallo de un registro individual **no detiene el procesamiento del lote completo**.

### Definición

```sql
registrar_fichadas(
    p_data_json_text TEXT -- Debe contener un array JSON casteado a text de fichadas
) 
RETURNS jsonb;
```

---

## 2. Parámetro de Entrada y Salida de la funcion

| Parámetro | Dirección | Tipo SQL | Obligatorio | Descripción |
| --- | --- | --- | --- | --- |
| `p_data_json_text` | `IN` | `TEXT` | Sí | Cadena JSON que representa el **array de fichadas** a procesar. |
| **Retorno** | `OUT` | `jsonb` | — | Objeto JSON de salida con el resultado global, contadores y detalles de errores. |

---

## 2.1. Texto de Entrada (`p_data_json_text`)

El parámetro de entrada debe contener un **JSON válido** que represente un **array de objetos de fichadas**.  
Si el texto no puede convertirse a `jsonb` o el contenido no es un array, la función devuelve un error estructural (**400**).

### Estructura de cada Objeto Fichada

| Clave | Tipo Esperado | Obligatorio | Descripción |
| --- | --- | --- | --- |
| `idper` | `TEXT` | Sí | Identificador único de la persona asociada al registro. |
| `tipo_fichada` | `TEXT` | Sí | Clasificación de la fichada (**valores permitidos: "E" \| "S" \| "O"**). |
| `fecha` | `DATE` (string) | Sí | Fecha de la fichada (`YYYY-MM-DD`). |
| `hora` | `TIME WITH TIME ZONE` (string) | Sí | Hora de la fichada (`HH:MM:SS-03`). |
| `id_original` | `TEXT` | Sí | Identificador único del registro en el sistema fuente. |
| `observaciones` | `TEXT` | No | Texto libre con comentarios. |
| `punto` | `TEXT` | No | Coordenadas GPS donde ocurrió la fichada **Ej: "-34.7143309,-58.2712032"**. |
| `tipo_dispositivo` | `TEXT` | No | Categoría del dispositivo que generó la fichada. |

---

## 2.2. JSON de Salida

La función devuelve un objeto `jsonb` con los resultados del procesamiento.

| Clave | Tipo | Descripción |
| --- | --- | --- |
| `status` | `TEXT` | Resultado global (`OK`, `SUCCESS_PARTIAL`, `ERROR`). |
| `code` | `INTEGER` | Código numérico del estado (`200`, `207`, `400`, `403`, `500`). |
| `message` | `TEXT` | Descripción breve del resultado. |
| `cant_procesadas` | `INTEGER` | Cantidad total de fichadas recibidas. |
| `cant_insertadas` | `INTEGER` | Cantidad de fichadas insertadas correctamente. |
| `cant_fallidas` | `INTEGER` | Cantidad de fichadas que fallaron. |
| `fallidas` | `JSONB[]` | Detalle de los registros fallidos con su índice, código y mensaje de error. |

---

## 3. Códigos de Estado y Errores

| Condición | status | code | message | cant_proc. | cant_insert. | cant_fall. |
|---|---:|---:|---|---:|---:|---:|
| Éxito Total | `OK` | 200 | "Lote procesado con éxito." | N | N | 0 |
| Éxito Parcial | `SUCCESS_PARTIAL` | 207 | "Lote procesado con fallos..." | N | N menos fallidas | >0 |
| Error Estructural | `ERROR` | 400 | "El formato de entrada no es un array válido." | 0 | 0 | 0 |
| Error Configuración | `ERROR` | 403 | "La funcionalidad de procesamiento de fichadas se encuentra deshabilitada." | N | 0 | 0 |
| Error Total Lógico | `ERROR` | 500 | "Error fatal de procesamiento: Todas las fichadas del lote fallaron." | N | 0 | N |

---

## 4. Ejemplo de Uso y Llamada

### 4.1. JSON de Entrada de Ejemplo

```json
[
  {
    "idper": "EMP9001",
    "tipo_fichada": "E",
    "fecha": "2025-10-14",
    "hora": "09:00:00-03",
    "id_original": "WEB1001",
    "punto": "-34.7143309,-58.2712032"
  },
  {
    "tipo_fichada": "S",
    "fecha": "2025-10-14",
    "hora": "17:00:00-03",
    "id_original": "WEB1002",
    "observaciones": "Fichada por olvido."
  }
]
```

### 4.2. Invocación SQL

```sql
SELECT siper.registrar_fichadas('
[
  {
    "idper": "EMP9001",
    "tipo_fichada": "E",
    "fecha": "2025-10-14",
    "hora": "09:00:00-03",
    "id_original": "WEB1001",
    "punto": "-34.7143309,-58.2712032"
  },
  {
    "tipo_fichada": "S",
    "fecha": "2025-10-14",
    "hora": "17:00:00-03",
    "id_original": "WEB1002"
  }
]'::text);
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
  "message": "Lote procesado con fallos. Revise 'fallidas' y end_status de bitácora.",
  "cant_procesadas": 2,
  "cant_insertadas": 1,
  "cant_fallidas": 1,
  "fallidas": [
    {
      "index": 2,
      "error_code": "23502",
      "error_message": "ERROR: valor nulo en columna «idper» de la relación «fichadas» viola la restricción no nula",
      "fichada_data": {
        "tipo_fichada": "S",
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
  "message": "El formato de entrada no es JSON válido.",
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
