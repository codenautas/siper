CREATE UNIQUE INDEX "idx_usuario_activo_sincro" 
ON "cola_sincronizacion_usuarios_modulo" ("usuario") 
WHERE ("estado" != 'PROCESADO');

CREATE OR REPLACE FUNCTION siper.fn_trigger_sincro_usuarios_modulo()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
DECLARE
    -- Banderas de decisión
    v_debe_desactivar_previo   BOOLEAN := false;
    v_debe_procesar_actual     BOOLEAN := false;
    v_accion_actual            TEXT; -- 'ACTUALIZAR' o 'DESACTIVAR'
    
    -- Variables auxiliares
    v_algoritmo_actual         TEXT;
BEGIN
    -- 1. Determinar algoritmo del registro que disparó el trigger
    v_algoritmo_actual := CASE WHEN TG_OP = 'DELETE' THEN OLD.algoritmo_pass ELSE NEW.algoritmo_pass END;

    -- Guard: Si no es el algoritmo requerido, ignoramos
    IF (COALESCE(v_algoritmo_actual, '') != 'PG-SHA256') THEN
        RETURN NULL;
    END IF;

    -- 2. LÓGICA DE DECISIÓN
    
    -- Caso A: Cambio de nombre (Renombre)
    -- Si es un UPDATE y el nombre de usuario cambió, hay que "apagar" el nombre anterior.
    IF (TG_OP = 'UPDATE' AND OLD.usuario IS DISTINCT FROM NEW.usuario) THEN
        v_debe_desactivar_previo := true;
    END IF;

    -- Caso B: Determinar qué hacer con el usuario "actual"
    IF (TG_OP = 'DELETE') THEN
        v_debe_procesar_actual := true;
        v_accion_actual        := 'DESACTIVAR';

    ELSIF (NEW.idper IS NULL) THEN
        -- Si el registro actual no tiene persona, solo nos interesa si antes SÍ tenía (Desvínculo)
        IF (TG_OP = 'UPDATE' AND OLD.idper IS NOT NULL) THEN
            v_debe_procesar_actual := true;
            v_accion_actual        := 'DESACTIVAR';
        END IF;
    
    ELSE 
        -- El registro tiene idper (está vinculado)
        -- Sincronizamos si es nuevo o si cambiaron datos relevantes
        IF (TG_OP = 'INSERT' OR OLD.* IS DISTINCT FROM NEW.*) THEN
            v_debe_procesar_actual := true;
            v_accion_actual        := 'ACTUALIZAR';
        END IF;
    END IF;

    -- 3. EJECUCIÓN DE ACCIONES EN LA COLA

    -- Acción para el usuario PREVIO (solo en renombres)
    IF (v_debe_desactivar_previo) THEN
        INSERT INTO siper.cola_sincronizacion_usuarios_modulo (usuario, accion, estado, creado_en, actualizado_en)
        VALUES (OLD.usuario, 'DESACTIVAR', 'PENDIENTE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        ON CONFLICT (usuario) WHERE (estado != 'PROCESADO')
        DO UPDATE SET accion = 'DESACTIVAR', estado = 'PENDIENTE', actualizado_en = NOW(), intentos = 0, respuesta_sp = null;
    END IF;

    -- Acción para el usuario ACTUAL (Alta, Modificación, Baja o Desvínculo)
    IF (v_debe_procesar_actual) THEN
        INSERT INTO siper.cola_sincronizacion_usuarios_modulo (usuario, accion, estado, creado_en, actualizado_en)
        VALUES (CASE WHEN TG_OP = 'DELETE' THEN OLD.usuario ELSE NEW.usuario END, v_accion_actual, 'PENDIENTE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        ON CONFLICT (usuario) WHERE (estado != 'PROCESADO')
        DO UPDATE SET accion = v_accion_actual, estado = 'PENDIENTE', actualizado_en = NOW(), intentos = 0, respuesta_sp = null;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tr_sincro_usuarios_modulo_global ON "usuarios";

CREATE TRIGGER tr_sincro_usuarios_modulo_global
    AFTER INSERT OR DELETE OR UPDATE OF usuario, activo, hashpass, idper
    ON "usuarios"
    FOR EACH ROW
    EXECUTE FUNCTION siper.fn_trigger_sincro_usuarios_modulo();
