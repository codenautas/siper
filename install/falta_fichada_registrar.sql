-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE PROCEDURE falta_fichada_registrar()
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    lock_id BIGINT := hashtext('falta_fichada_registrar_running');  -- ID único para el lock
    v_fecha_actual DATE := CURRENT_DATE;
    v_hora_actual TIME := CURRENT_TIME;
    v_persona RECORD;
    v_novedad RECORD;
    v_horario RECORD;
    v_umbral_entrada INTEGER;
    v_umbral_salida INTEGER;
    v_hora_esperada_entrada TIME;
    v_hora_esperada_salida TIME;
    v_tiene_fichada_entrada BOOLEAN;
    v_tiene_fichada_salida BOOLEAN;
    v_ya_notificado_entrada BOOLEAN;
    v_ya_notificado_salida BOOLEAN;
BEGIN
    -- Intentar adquirir el lock
    IF NOT pg_try_advisory_lock(lock_id) THEN
        -- Si el lock ya está tomado, evita superposición
        RAISE NOTICE 'Procedimiento ya en ejecución. Saliendo.';
        RETURN;
    END IF;

    -- Lógica principal: Iterar sobre personas activas
    FOR v_persona IN
        SELECT idper, banda_horaria
        FROM personas
        WHERE activo = TRUE
    LOOP
        -- Obtener novedad vigente del día actual
        SELECT nv.cod_nov, cn.requiere_fichadas
        INTO v_novedad
        FROM novedades_vigentes nv
        LEFT JOIN cod_novedades cn ON nv.cod_nov = cn.cod_nov  -- JOIN para obtener requiere_fichadas
        WHERE nv.idper = v_persona.idper AND nv.fecha = v_fecha_actual
        LIMIT 1;

        -- Si no hay novedad o no requiere fichadas, saltear
        IF v_novedad IS NULL OR v_novedad.requiere_fichadas = FALSE THEN
            CONTINUE;
        END IF;

        -- Obtener umbrales de la banda horaria
        SELECT umbral_aviso_falta_entrada, umbral_aviso_falta_salida
        INTO v_umbral_entrada, v_umbral_salida
        FROM bandas_horarias
        WHERE banda_horaria = v_persona.banda_horaria;

        -- Obtener horario del día actual (basado en dds = EXTRACT(DOW FROM v_fecha_actual))
        SELECT hora_desde, hora_hasta
        INTO v_hora_esperada_entrada, v_hora_esperada_salida
        FROM horarios_per hp
        JOIN horarios_dds hd ON hp.horario = hd.horario
        WHERE hp.idper = v_persona.idper
          AND v_fecha_actual BETWEEN hp.desde AND hp.hasta
          AND hd.dds = EXTRACT(DOW FROM v_fecha_actual)
          AND hd.trabaja = TRUE
        LIMIT 1;

        -- Si no hay horario para el día, saltear
        IF v_hora_esperada_entrada IS NULL OR v_hora_esperada_salida IS NULL THEN
            CONTINUE;
        END IF;

        -- Verificar si ya hay fichadas para entrada y salida
        SELECT EXISTS(SELECT 1 FROM fichadas WHERE idper = v_persona.idper AND fecha = v_fecha_actual AND tipo_fichada = 'E') INTO v_tiene_fichada_entrada;
        SELECT EXISTS(SELECT 1 FROM fichadas WHERE idper = v_persona.idper AND fecha = v_fecha_actual AND tipo_fichada = 'S') INTO v_tiene_fichada_salida;

        -- Verificar si ya se notificó
        SELECT EXISTS(SELECT 1 FROM avisos_falta_fichada WHERE idper = v_persona.idper AND fecha = v_fecha_actual AND tipo_fichada = 'E') INTO v_ya_notificado_entrada;
        SELECT EXISTS(SELECT 1 FROM avisos_falta_fichada WHERE idper = v_persona.idper AND fecha = v_fecha_actual AND tipo_fichada = 'S') INTO v_ya_notificado_salida;

        -- Notificar falta de entrada si se supera el umbral y no se ha notificado ni fichado
        IF v_hora_actual > (v_hora_esperada_entrada + (v_umbral_entrada || ' minutes')::INTERVAL)
           AND NOT v_tiene_fichada_entrada
           AND NOT v_ya_notificado_entrada THEN
            INSERT INTO avisos_falta_fichada (idper, fecha, tipo_fichada, avisado_wp)
            VALUES (v_persona.idper, v_fecha_actual, 'E', v_hora_actual);
            
        END IF;

        -- Notificar falta de salida si se supera el umbral y no se ha notificado ni fichado
        IF v_hora_actual > (v_hora_esperada_salida + (v_umbral_salida || ' minutes')::INTERVAL)
           AND NOT v_tiene_fichada_salida
           AND NOT v_ya_notificado_salida THEN
            INSERT INTO avisos_falta_fichada (idper, fecha, tipo_fichada, avisado_wp)
            VALUES (v_persona.idper, v_fecha_actual, 'S', v_hora_actual);
            
        END IF;

    END LOOP;

    -- Libera el lock
    PERFORM pg_advisory_unlock(lock_id);
    
    RAISE NOTICE 'Procedimiento completado.';
EXCEPTION
    WHEN OTHERS THEN
        -- En caso de error, libera el lock
        PERFORM pg_advisory_unlock(lock_id);
        RAISE;
END;
$$;