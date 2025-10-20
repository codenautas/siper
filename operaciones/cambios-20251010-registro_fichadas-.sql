SET ROLE siper_owner;

CREATE OR REPLACE PROCEDURE siper.procesar_fichadas(
    IN p_data_json jsonb,
    OUT p_resultado jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bitacora_id BIGINT;
    v_start_time TIMESTAMP WITH TIME ZONE := now();
    v_has_error BOOLEAN := FALSE;
    v_end_status TEXT := 'OK';
    v_error_message TEXT;
    
    v_status_code INTEGER := 200; 
    
    v_cant_insertadas INTEGER := 0;      -- Éxitos
    v_cant_procesadas INTEGER := 0;      -- Total procesado
    v_cant_fallidas INTEGER := 0;        -- Fallos individuales
    v_fallidas JSONB := '[]'::jsonb;     -- Detalle JSON de fallos (para retorno a cliente)
    
    v_username TEXT := current_user; 
    v_machine_id TEXT := COALESCE(p_data_json->>'machine_id', 'UNKNOWN_MACHINE');
    v_navigator TEXT := COALESCE(p_data_json->>'navigator', 'UNKNOWN_NAV');
    
    v_fichadas_array jsonb := p_data_json->'fichadas';
    v_is_structurally_valid BOOLEAN := TRUE; 
    
    -- Variable para determinar si la carga de fichadas está activa.
    v_is_enabled BOOLEAN; 
    
    -- Loop variables
    v_fichada JSONB; 
    v_idx INTEGER := 0;
    
    -- Variable para la condensación (ahora contendrá el JSON completo serializado)
    v_fallas_condensed TEXT := '';
    
BEGIN
    
    -- -------------------------------------------------------------------
    -- PASO 1: REGISTRO INICIAL EN BITÁCORA (Transaccional)
    -- -------------------------------------------------------------------
    INSERT INTO his.bitacora (
        procedure_name, parameters, username, machine_id, navigator, init_date, end_status
    ) VALUES (
        'siper.procesar_fichadas', p_data_json::TEXT, v_username, v_machine_id, v_navigator, v_start_time, 'INICIADO'
    ) RETURNING id INTO v_bitacora_id;
    
    -- -------------------------------------------------------------------
    -- PASO 1.5: OBTENER ESTADO DE HABILITACIÓN DESDE LA TABLA PARAMETROS
    -- (Se asume que el registro con unico_registro=TRUE siempre existe)
    -- -------------------------------------------------------------------
    
    -- Consulta: SELECT permite_cargar_fichadas FROM parametros WHERE unico_registro = TRUE
    SELECT permite_cargar_fichadas
    INTO v_is_enabled
    FROM parametros
    WHERE unico_registro = TRUE;

    
    -- -------------------------------------------------------------------
    -- CHEQUEO DE VALIDACIÓN ESTRUCTURAL (Error 400)
    -- -------------------------------------------------------------------
    IF v_fichadas_array IS NULL OR jsonb_typeof(v_fichadas_array) <> 'array' THEN
        
        v_is_structurally_valid := FALSE;
        v_has_error := TRUE;
        v_status_code := 400;
        v_end_status := '400 BAD REQUEST: Estructura JSON inválida o array "fichadas" ausente.';
        v_error_message := 'Fallo en el formato de entrada.';
        v_cant_procesadas := 0;
        
    ELSE
        SELECT jsonb_array_length(v_fichadas_array) INTO v_cant_procesadas;
    END IF;
    
    -- -------------------------------------------------------------------
    -- CHEQUEO DE HABILITACIÓN FUNCIONAL (Error 403)
    -- Solo se chequea si la estructura es válida.
    -- -------------------------------------------------------------------
    IF v_is_structurally_valid AND COALESCE(v_is_enabled, FALSE) IS FALSE THEN
        v_has_error := TRUE;
        v_status_code := 403;
        v_end_status := '403 FORBIDDEN: Funcionalidad de procesamiento de fichadas deshabilitada por configuración.';
        v_error_message := 'La funcionalidad de procesamiento de fichadas se encuentra deshabilitada.';
    END IF;
    
    
    -- -------------------------------------------------------------------
    -- PASO 2: LÓGICA DE INSERCIÓN Y CAPTURA DE FALLOS (Best-Effort Loop)
    -- Solo ejecuta si es estructuralmente válido y el estado inicial es 200 (no 400 o 403)
    -- -------------------------------------------------------------------
    IF v_is_structurally_valid AND v_status_code = 200 AND v_cant_procesadas > 0 THEN 
        
        -- PROCESAMIENTO POR LOTE (Best-Effort)
        FOR v_fichada IN SELECT * FROM jsonb_array_elements(v_fichadas_array) LOOP
            v_idx := v_idx + 1; -- Índice para seguimiento (1-based)
            
            -- Usamos BEGIN/EXCEPTION dentro del loop para aislar fallos individuales
            BEGIN
                -- Inserción individual
                INSERT INTO siper.fichadas (
                    idper, tipo_fichada, fecha, hora, observaciones, punto, tipo_dispositivo, id_original
                ) 
                VALUES (
                    v_fichada->>'idper', 
                    v_fichada->>'tipo_fichada', 
                    (v_fichada->>'fecha')::DATE,
                    (v_fichada->>'hora')::TIME WITH TIME ZONE,
                    v_fichada->>'observaciones',
                    v_fichada->>'punto',
                    v_fichada->>'tipo_dispositivo',
                    v_fichada->>'id_original'
                );
                
                v_cant_insertadas := v_cant_insertadas + 1;

            EXCEPTION
                WHEN OTHERS THEN
                    -- CASO: Fallo por restricción (Error individual)
                    v_has_error := TRUE; 
                    v_cant_fallidas := v_cant_fallidas + 1;
                    
                    -- Almacenamos el detalle del fallo (para retorno al cliente)
                    -- Limpiamos el error_message antes de insertarlo en el JSON de fallas
                    v_fallidas := v_fallidas || jsonb_build_object(
                        'index', v_idx, 
                        'error_code', SQLSTATE,
                        'error_message', TRANSLATE(SQLERRM, chr(10), ' '), -- Usamos TRANSLATE para limpiar saltos de línea del error
                        'fichada_data', v_fichada 
                    );
                    
                    CONTINUE; 
            END;
            
        END LOOP; -- Fin del LOOP de fichadas

        -- AJUSTE CLAVE PARA EL 207/500:
        -- Solo establecemos 207 si hubo fallos Y al menos una inserción fue exitosa.
        -- Si v_cant_insertadas es 0, el estado se mantiene en 200 para que el bloque 500 lo detecte.
        IF v_cant_fallidas > 0 AND v_cant_insertadas > 0 THEN
            v_status_code := 207; -- Éxito parcial
            v_end_status := '207 PARTIAL FAILURE: ' || v_cant_fallidas || ' fallaron (' || v_cant_insertadas || ' OK).';
            v_error_message := 'Lote procesado con fallos. Revise "fallidas" y end_status de bitácora.';
        END IF;

    END IF; -- Fin del PASO 2
    
    -- -------------------------------------------------------------------
    -- AJUSTE DE ESTADO FINAL (500/200/207)
    -- -------------------------------------------------------------------
    
    -- CASO 500: Lote Válido y procesado, pero todas las inserciones fallaron (v_cant_insertadas = 0)
    -- Se activa si el estado NO ha sido cambiado a 207 (es decir, sigue en 200).
    IF v_status_code = 200 AND v_cant_procesadas > 0 AND v_cant_insertadas = 0 THEN
        v_has_error := TRUE;
        v_status_code := 500;
        v_end_status := '500 ALL FAILED: Ninguna fichada pudo ser insertada.';
        v_error_message := 'Error fatal de procesamiento: Todas las fichadas del lote fallaron.';
    
    -- CASO 200: Éxito total. Solo si el estado sigue siendo 200.
    ELSIF v_status_code = 200 THEN
        v_end_status := format('200 OK: %s fichadas insertadas.', v_cant_insertadas);
        v_error_message := COALESCE(v_error_message, 'Lote procesado con éxito.');
    END IF;
    
    -- -------------------------------------------------------------------
    -- PASO 3: INCLUIR JSON DE FALLAS EN END_STATUS Y ACTUALIZAR BITÁCORA
    -- -------------------------------------------------------------------
    IF v_cant_fallidas > 0 THEN
        
        -- 1. Serializar el JSONB de fallas (v_fallidas) a texto y eliminar todos los saltos de línea (chr(10)) 
        v_fallas_condensed := TRANSLATE(v_fallidas::TEXT, chr(10), ' ');
        
        -- 2. Concatenar el estado principal con el JSON completo de fallas serializado.
        v_end_status := v_end_status || ' | FALLAS_JSON: ' || v_fallas_condensed;
        
    END IF;
    
    -- Actualización final de la bitácora
    UPDATE his.bitacora
    SET 
        end_date = now(),
        has_error = v_has_error,
        -- Al ser TEXT, se almacena el JSON completo.
        end_status = v_end_status 
    WHERE id = v_bitacora_id;
    
    
    -- -------------------------------------------------------------------
    -- PASO 4: PREPARAR SALIDA (Para el cliente, incluye el JSON de fallas)
    -- -------------------------------------------------------------------
    p_resultado := jsonb_build_object(
        'status', CASE 
            WHEN v_status_code = 500 THEN 'ERROR'
            WHEN v_status_code = 403 THEN 'ERROR' 
            WHEN v_status_code = 400 THEN 'ERROR'
            WHEN v_status_code = 207 THEN 'SUCCESS_PARTIAL'
            ELSE 'OK' 
        END,
        'code', v_status_code,
        'message', v_error_message,
        'cant_procesadas', v_cant_procesadas, 
        'cant_insertadas', v_cant_insertadas,
        'cant_fallidas', v_cant_fallidas,
        'fallidas', v_fallidas 
    );

EXCEPTION
    -- Captura errores FATALES (fuera de la lógica Best-Effort)
    WHEN OTHERS THEN
        
        -- La transacción abortará.
        
        p_resultado := jsonb_build_object(
            'status', 'ERROR',
            'code', 500,
            'message', 'Fallo interno fatal e irrecuperable del procedimiento: ' || SQLERRM,
            'cant_procesadas', v_cant_procesadas,
            'cant_insertadas', 0,
            'cant_fallidas', v_cant_fallidas,
            'fallidas', v_fallidas
        );
        
        RAISE; -- Aborta la transacción completa
END;
$$;
