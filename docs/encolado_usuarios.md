# Especificación Técnica: Tabla siper.cola_sincronizacion_usuarios_modulo

## 1. Propósito
Gestionar la sincronización de identidades entre Siper y el módulo externo. La solución asegura que solo los usuarios designados como "Principales" sean replicados, administrando cambios de identidad, bajas lógicas y físicas, y garantizando la entrega del estado más reciente mediante una cola de eventos persistente.

## 2. Componentes de la Solución
- **Tabla de Usuarios (siper.usuarios)**: Origen de datos. Incorpora el campo principal (booleano) para determinar la identidad activa por cada idper.
- **Tabla de Cola (siper.cola_sincronizacion_usuarios_modulo)**: Registro persistente de eventos pendientes de procesar.
- **Índice Único Parcial**: Restricción a nivel de base de datos que impide la existencia de más de un usuario principal = true por cada idper.
- **Trigger de Sincronización (tr_sincro_usuarios_modulo_global)**: El "agente" que detecta cambios y gestiona la cola.

## 3. Flujo de Encolado
El proceso se activa automáticamente ante las siguientes operaciones en la tabla de usuarios:
- **INSERT o DELETE** de un usuario.
- **UPDATE** exclusivamente de los campos: nombre, apellido, activo, hashpass e idper.

**Nota:** Cambios en otros campos (como teléfono o mail) no dispararán la sincronización para optimizar el rendimiento.

### Condiciones de Entrada
Para que un evento sea efectivamente encolado, deben cumplirse estas condiciones:
- **Existencia de ID Per**: El registro debe poseer un idper no nulo.
- **Algoritmo Específico**: El campo algoritmo_pass debe ser estrictamente igual a 'PG-SHA256'.

### Lógica de Decisión
El trigger evalúa dos posibles acciones simultáneas:
- **Desactivación de Identidad Previa**: Si un UPDATE cambia el idper o el usuario deja de ser principal, se encola una orden de DESACTIVAR para el ID que quedó huérfano.
- **Sincronización de Registro Actual**: Si es un DELETE físico: Se encola DESACTIVAR. Si es un INSERT/UPDATE y el usuario es principal: Se encola ACTUALIZAR (solo si hubo cambios en campos críticos)


## 4. Acciones de Sincronización

| Acción      | Descripción                                                     |
|-------------|---------------------------------------------------------------|
| ACTUALIZAR  | El usuario es el principal activo. Se deben enviar sus datos actuales y estado activo.                 |
| DESACTIVAR  | El ID ya no pertenece a un usuario principal o fue borrado. Se debe marcar como inactivo. |

## 5. Estados del Evento
La tabla de cola gestiona el ciclo de vida de cada sincronización mediante los siguientes estados:

| Estado      | Descripción                                                     |
|-------------|---------------------------------------------------------------|
| PENDIENTE   | Registro listo para ser tomado por el worker.                 |
| EN_PROCESO  | El worker ha tomado el registro y está ejecutando el proceso externo. |
| PROCESADO   | Sincronización exitosa confirmada.                            |
| ERROR       | Falló la ejecución. El sistema permitirá reintentos automáticos.|
| AGOTADO     | Se alcanzó el límite máximo de intentos (5) sin éxito.       |

## 6. Lógica de Persistencia (Upsert)
El encolado utiliza una lógica de "Conflicto Inteligente" basada en los estados definidos anteriormente:
- Si el usuario no está en la cola (o ya fue PROCESADO): Se crea un nuevo registro con estado PENDIENTE.
- Si el usuario ya tiene un evento activo: Si existe un registro con cualquier estado distinto a PROCESADO (ya sea ERROR, AGOTADO o incluso EN_PROCESO), el sistema no crea una fila nueva. En su lugar, actualiza la existente, resetea el contador de intentos a 0 y devuelve el estado a PENDIENTE.

### Protección de Concurrencia
Si un registro cambia mientras está EN_PROCESO, el reseteo a PENDIENTE asegura que el worker, al finalizar su tarea actual, detecte que hay un nuevo cambio pendiente y vuelva a procesar al usuario con la información más reciente.

## 7. Consideraciones de Seguridad y Robustez
- **Security Definer**: La función del trigger se ejecuta con los privilegios del propietario de la base de datos, garantizando el éxito del encolado independientemente de los permisos del usuario que opera en la web/app.
- **Desacoplamiento**: Si el módulo externo está caído, el evento permanece en la cola de forma persistente hasta que el servicio se restablezca.