# Especificación Técnica: Sincronización de Usuarios (Siper ↔ Módulo Externo)

## 1. Propósito

Garantizar la consistencia de identidades entre **Siper (PostgreSQL)** y el **Módulo Externo (SQL Server)**.

El sistema implementa un patrón **Transactional Outbox** mediante una cola de eventos persistente para asegurar la replicación de **altas, bajas y modificaciones de usuarios**.

---

## 2. Componentes de la Solución

### Tabla de Usuarios

**`siper.usuarios`**

Origen de datos. El sistema monitorea:

- `usuario`
- `activo`
- `hashpass`
- `idper`

**Optimización**

Campos no críticos (ej. `mail` o `telefono`) **no disparan el flujo**.

### Tabla de Sincronización

**`siper.sinc_fichadores`**

Esta tabla implementa la **cola persistente de eventos**. Cada registro representa una operación de sincronización pendiente o procesada entre **Siper (PostgreSQL)** y el **módulo externo (SQL Server)**.

Los registros son generados automáticamente por el **trigger `tr_sincro_usuarios_modulo_global`** cuando ocurren cambios relevantes en la tabla `usuarios`.

Posteriormente son consumidos por un **worker** que ejecuta el stored procedure `spUpsertEmpleado` en el sistema externo.

---

## Estructura de la Tabla

| Campo | Tipo | Descripción |
|-----|-----|-----|
| `num_sincro` | bigint | Identificador único del evento de sincronización. Generado por la secuencia `sinc_usuarios_seq`. |
| `usuario` | text | Identificador del usuario afectado por el evento. |
| `accion` | text | Tipo de operación a ejecutar en el sistema externo. |
| `estado` | text | Estado actual del evento dentro de la cola de sincronización. |
| `intentos` | integer | Cantidad de intentos de ejecución realizados por el worker. |
| `parametros` | text | JSON serializado con los datos enviados al stored procedure del módulo externo. |
| `respuesta_sp` | text | JSON con la respuesta recibida del stored procedure ejecutado en SQL Server. |
| `creado_en` | timestamp | Momento en que el evento fue creado. |
| `actualizado_en` | timestamp | Última actualización del registro. |

---

## Clave Primaria

```sql
PRIMARY KEY (num_sincro)
```

### Índice Único Parcial

**`idx_usuario_activo_sincro`**

Restricción que impide duplicados en la cola para un mismo usuario siempre que el evento **no haya sido PROCESADO**.

### Trigger de Sincronización

**`tr_sincro_usuarios_modulo_global`**

Agente que detecta cambios y gestiona la lógica de **Upsert** en la cola.

---

## 3. Activación del Trigger de Sincronización

El trigger `tr_sincro_usuarios_modulo_global` se ejecuta automáticamente cuando se producen cambios en la tabla `siper.usuarios`.

El trigger se dispara en las siguientes operaciones:

- `AFTER INSERT`
- `AFTER UPDATE`
- `AFTER DELETE`

Esto permite detectar cualquier cambio relevante en la identidad del usuario que deba replicarse en el módulo externo.

---

## Campos Monitoreados

No todos los cambios en la tabla `usuarios` generan eventos de sincronización.

El trigger evalúa únicamente modificaciones en los campos considerados **críticos para la identidad del usuario**:

- `usuario`
- `activo`
- `hashpass`
- `idper`

Cambios en otros campos (por ejemplo `email` u otros datos secundarios) **no generan eventos en la cola de sincronización**.

---

## Condición de Vinculación con Persona

La sincronización con el módulo externo solo aplica a usuarios que estén vinculados a una persona del sistema.

Esta vinculación se determina mediante el campo **idper**




### Matriz de Acciones (Lógica de Decisión)

| Escenario | Acción Registrada | Condición Técnica |
|---|---|---|
| Alta / Modificación | ACTUALIZAR | El registro tiene `idper` (está vinculado) y es nuevo o cambió |
| Baja Física | DESACTIVAR | Operación `DELETE` sobre el usuario |
| Desvínculo | DESACTIVAR | `UPDATE` donde `idper` pasa a `NULL` |
| Renombre | DESACTIVAR + ACTUALIZAR | Se encola la baja del `OLD.usuario` y el alta del `NEW.usuario` |

---

## 4. Ciclo de Vida y Resiliencia

Estados de la cola:

- `PENDIENTE`
- `EN_PROCESO`
- `PROCESADO`
- `ERROR`
- `AGOTADO` (máximo **5 intentos**)

### Lógica de Conflicto Inteligente (Upsert)

Si ocurre un cambio en un usuario que **ya tiene un evento activo en la cola**:

- Se **actualiza la fila existente** (no se crean duplicados)
- Se **resetean los intentos a 0**
- El estado vuelve a **PENDIENTE**
- Se limpia la **respuesta_sp** anterior para procesar la nueva versión del dato

---

## 5. Procesamiento de la Cola de Sincronización

Los eventos registrados en `siper.sinc_fichadores` son procesados de forma asincrónica por un proceso periódico que ejecuta la sincronización con el módulo externo.

---

### Consumo de Eventos

El proceso de sincronización se ejecuta periódicamente (actualmente cada **60 segundos**) y realiza las siguientes operaciones:

1. Consulta la tabla `siper.sinc_fichadores`.
2. Selecciona un lote limitado de eventos en estado:

   - `PENDIENTE`
   - `ERROR`

3. Los registros seleccionados se bloquean temporalmente para evitar que múltiples instancias del proceso los ejecuten simultáneamente.

Para ello se utiliza el mecanismo de concurrencia de PostgreSQL:

```sql
FOR UPDATE SKIP LOCKED
```

Esto permitiría eventualmente que **varios workers puedan procesar la cola en paralelo sin conflictos**.

---

### Preparación de la Información

Para cada evento seleccionado:

- se leen los datos del registro en `sinc_fichadores`
- en caso de operaciones de actualización se consultan los datos asociados en la tabla `personas`
- se construye la información necesaria para sincronizar el usuario en el módulo externo

El contenido enviado al sistema externo se registra en el campo `parametros`.

Esto permite mantener trazabilidad del proceso de sincronización.

---

### Ejecución de la Sincronización

Una vez preparados los datos, el proceso invoca el procedimiento de sincronización del módulo externo en **SQL Server**.

El resultado de esa ejecución se registra en el campo `respuesta_sp` de la tabla `sinc_fichadores`.

Esto permite auditar el resultado de cada intento de sincronización.

---

### Gestión de Resultados

El resultado de la ejecución determina el nuevo estado del evento.

| Resultado | Acción |
|----------|-------|
| ejecución exitosa | el evento pasa a estado `PROCESADO` |
| error durante la ejecución | el evento pasa a estado `ERROR` |
| múltiples fallos consecutivos | el evento pasa a estado `AGOTADO` |

El contador `intentos` se incrementa en cada fallo.

Cuando el número de intentos alcanza el máximo configurado (actualmente **5**), el evento se marca como `AGOTADO`.

Los eventos en este estado requieren intervención manual.

---

### Comportamiento ante Fallos del Sistema Externo

Si el módulo externo no se encuentra disponible (por ejemplo, problemas de conexión con SQL Server):

- los eventos no se pierden
- permanecen registrados en `sinc_fichadores`
- serán reintentados automáticamente en ciclos posteriores

Este mecanismo garantiza **consistencia eventual entre ambos sistemas**, incluso ante fallos temporales del sistema externo.

---

## 6. Robustez y Trazabilidad

### Security Definer

El trigger se ejecuta con **privilegios elevados** para asegurar el encolado.

### Auditoría Completa

En `sinc_fichadores` se persiste:

- el JSON enviado (`parametros`)
- el JSON recibido (`respuesta_sp`)

Esto permite **reconstruir cualquier fallo en la sincronización**.

### Desacoplamiento

El sistema garantiza que **la aplicación principal siga operativa** aunque el **módulo externo no esté disponible**.