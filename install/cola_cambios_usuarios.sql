CREATE UNIQUE INDEX idx_usuarios_idper_principal_true
ON siper.usuarios (idper)
WHERE (principal = true);

CREATE UNIQUE INDEX "idx_idper_activo_sincro" 
ON "cola_sincronizacion_usuarios_modulo" ("idper") 
WHERE ("estado" != 'PROCESADO');

CREATE OR REPLACE FUNCTION siper.fn_trigger_sincro_usuarios_modulo()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
DECLARE
    -- Datos del registro en su estado actual (el que entra o se borra)
    v_idper_actual           TEXT;
    v_es_principal_actual    BOOLEAN;
    v_algoritmo_actual       TEXT;
    
    -- Datos del registro en su estado previo (solo para UPDATES)
    v_idper_previo           TEXT;
    v_es_principal_previo    BOOLEAN;

    -- Variables de decisión para las acciones en la cola
    v_debe_desactivar_identidad_previa  BOOLEAN := false;
    v_debe_sincronizar_registro_actual  BOOLEAN := false;
BEGIN
    -- Determinamos el algoritmo del registro que disparó el trigger
    v_algoritmo_actual := CASE WHEN TG_OP = 'DELETE' THEN OLD.algoritmo_pass ELSE NEW.algoritmo_pass END;

    -- Si el algoritmo no es el requerido, terminamos la ejecución de inmediato
    IF (COALESCE(v_algoritmo_actual, '') != 'PG-SHA256') THEN
        RETURN NULL;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        v_idper_actual        := OLD.idper;
        v_es_principal_actual := COALESCE(OLD.principal, false);
    ELSE
        v_idper_actual        := NEW.idper;
        v_es_principal_actual := COALESCE(NEW.principal, false);
    END IF;

    -- Capturamos el estado previo solo si es una actualización
    IF (TG_OP = 'UPDATE') THEN
        v_idper_previo        := OLD.idper;
        v_es_principal_previo := COALESCE(OLD.principal, false);
    END IF;
    
    -- ¿Hay que dar de baja la identidad anterior?
    -- Ocurre en UPDATE si el ID cambió o si el usuario dejó de ser el principal.
    IF (TG_OP = 'UPDATE' AND v_idper_previo IS NOT NULL) THEN
        IF (v_idper_previo IS DISTINCT FROM v_idper_actual OR (v_es_principal_previo = true AND v_es_principal_actual = false)) THEN
            v_debe_desactivar_identidad_previa := true;
        END IF;
    END IF;

    -- ¿Hay que sincronizar el estado del registro actual?
    IF (TG_OP = 'DELETE') THEN
        v_debe_sincronizar_registro_actual := true;
    ELSIF (v_es_principal_actual = true AND v_idper_actual IS NOT NULL) THEN
        -- Si es INSERT es directo. Si es UPDATE, solo si cambiaron datos relevantes.
        IF (TG_OP = 'INSERT' OR OLD.* IS DISTINCT FROM NEW.*) THEN
            v_debe_sincronizar_registro_actual := true;
        END IF;
    END IF;

    -- Notificar la desactivación del ID que ya no es válido
    IF (v_debe_desactivar_identidad_previa) THEN
        INSERT INTO siper.cola_sincronizacion_usuarios_modulo (idper, accion, estado, creado_en, actualizado_en)
        VALUES (v_idper_previo, 'DESACTIVAR', 'PENDIENTE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (idper) WHERE (estado != 'PROCESADO')
        DO UPDATE SET accion = 'DESACTIVAR', estado = 'PENDIENTE', actualizado_en = CURRENT_TIMESTAMP;
    END IF;

    -- Actualizar o Desactivar (por borrado) el ID actual
    IF (v_debe_sincronizar_registro_actual) THEN
        INSERT INTO siper.cola_sincronizacion_usuarios_modulo (idper, accion, estado, creado_en, actualizado_en)
        VALUES (
            v_idper_actual, 
            CASE WHEN TG_OP = 'DELETE' THEN 'DESACTIVAR' ELSE 'ACTUALIZAR' END, 
            'PENDIENTE',
            CURRENT_TIMESTAMP, 
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (idper) WHERE (estado != 'PROCESADO')
        DO UPDATE SET 
            accion = EXCLUDED.accion, 
            estado = 'PENDIENTE', 
            actualizado_en = CURRENT_TIMESTAMP;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tr_sincro_usuarios_modulo_global ON "usuarios";

CREATE TRIGGER tr_sincro_usuarios_modulo_global
    AFTER INSERT OR DELETE OR UPDATE OF nombre, apellido, activo, hashpass, idper, principal
    ON "usuarios"
    FOR EACH ROW
    EXECUTE FUNCTION fn_trigger_sincro_usuarios_modulo();
