-- Cambios para la versión 0.9.2: puntos GPS con el tipo point nativo,
-- con la convención (x,y) = (longitud,latitud) que usa earthdistance para el operador <@>.
-- sedes se crea con punto; en per_domicilios coordenada_x/coordenada_y pasan a punto;
-- en fichadas punto deja de ser text.

-- las extensiones se crean antes del set role por si requieren superusuario
create extension if not exists cube;          -- requerida por earthdistance
create extension if not exists earthdistance; -- para el operador <@>

set search_path = siper, public;
set role to siper_muleto_owner;

-- install/texto_gps_a_punto.sql (nueva)

CREATE OR REPLACE FUNCTION texto_gps_a_punto(p_texto text) RETURNS point
    IMMUTABLE
    LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_latitud  double precision;
    v_longitud double precision;
    v_punto    point;
BEGIN
    IF p_texto IS NULL OR p_texto = '' THEN
        RETURN null;
    ELSIF p_texto ~ '^\s*[-+]?\d+(\.\d+)?\s*,\s*[-+]?\d+(\.\d+)?\s*$' THEN
        v_latitud  := split_part(p_texto, ',', 1);
        v_longitud := split_part(p_texto, ',', 2);
    ELSIF p_texto ~ '^\s*\(' THEN
        v_punto := p_texto::point; -- si el literal está mal formado el cast lanza su propio error
        v_longitud := v_punto[0];
        v_latitud  := v_punto[1];
    ELSE
        RAISE 'texto GPS no interpretable: %', p_texto USING ERRCODE = 'P1013';
    END IF;
    IF abs(v_latitud) > 90 OR abs(v_longitud) > 180 THEN
        RAISE 'coordenadas GPS fuera de rango: %', p_texto USING ERRCODE = 'P1012';
    END IF;
    RETURN point(round(v_longitud, 4), round(v_latitud, 4));
END;
$BODY$;

create table "sedes" (
  "sede" text,
  "descripcion" text,
  "para_presencial" boolean,
  "punto" point
, primary key ("sede")
);
grant select, insert, update, delete on "sedes" to siper_muleto_admin;

do $SQL_ENANCE$
 begin
PERFORM enance_table('sedes','sede');
end
$SQL_ENANCE$;

---------------------------------------------------------------------
-- per_domicilios: coordenada_x, coordenada_y pasan a punto
---------------------------------------------------------------------

alter table per_domicilios DISABLE trigger per_domicilios_idgeo_trg; --momentáneo, para que no blanquee punto, obs_geo ni fecha_codificacion

alter table "per_domicilios" add column "punto" point;

update per_domicilios
   set punto = point(round(coordenada_x::decimal, 4), round(coordenada_y::decimal, 4))
 where coordenada_x is not null and coordenada_y is not null;

alter table "per_domicilios" drop column "coordenada_x";
alter table "per_domicilios" drop column "coordenada_y";

-- install/per_domicilios_idgeo_trg.sql (cambia: punto en vez de coordenada_x/coordenada_y)
CREATE OR REPLACE FUNCTION per_domicilios_idgeo_trg()
    RETURNS trigger
    LANGUAGE plpgsql
AS $BODY$
BEGIN
    IF TG_OP = 'INSERT' THEN
        new.idgeo := nextval('per_domicilios_idgeo_seq');
    ELSIF TG_OP = 'UPDATE' THEN
        IF (new.nombre_calle     IS DISTINCT FROM old.nombre_calle
         OR new.calle            IS DISTINCT FROM old.calle
         OR new.barrio_localidad IS DISTINCT FROM old.barrio_localidad
         OR new.altura           IS DISTINCT FROM old.altura
         OR new.comuna_partido   IS DISTINCT FROM old.comuna_partido
         OR new.provincia        IS DISTINCT FROM old.provincia) THEN
            new.idgeo              := nextval('per_domicilios_idgeo_seq');
            new.punto              := null;
            new.obs_geo            := null;
            new.fecha_codificacion := null;
        ELSIF (new.punto::text IS DISTINCT FROM old.punto::text -- point no tiene operador =
            OR new.obs_geo     IS DISTINCT FROM old.obs_geo) THEN
            new.fecha_codificacion := fecha_actual();
        END IF;
    END IF;
    RETURN new;
END;
$BODY$;

alter table per_domicilios ENABLE trigger per_domicilios_idgeo_trg;

alter table "fichadas" drop constraint "punto<>''";
alter table "fichadas" alter column "punto" type point using texto_gps_a_punto("punto");

-- install/sinc_fichadas_recibidas.sql (cambia: punto_gps se convierte con texto_gps_a_punto)
CREATE OR REPLACE FUNCTION procesar_fichada_recibida_trg() RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    set search_path=siper
AS
$$
DECLARE
    v_idper text;
    v_tipo_mapeado text;
    v_hora_redondeada time;
BEGIN
    BEGIN
        SELECT idper INTO v_idper
        FROM usuarios
        WHERE usuario = NEW.fichador;

        IF v_idper IS NULL THEN
            RAISE EXCEPTION 'Usuario "%" no encontrado en la tabla usuarios', NEW.fichador;
        END IF;

        v_tipo_mapeado := CASE
            WHEN lower(NEW.tipo) IN ('e', 'entrada') THEN 'E'
            WHEN lower(NEW.tipo) IN ('s', 'salida' ) THEN 'S'
            ELSE 'O'
        END CASE;

        v_hora_redondeada := date_trunc('minute',
            new.hora + CASE v_tipo_mapeado WHEN 'E' THEN '0'::interval WHEN 'S' THEN '59 seconds'::interval ELSE '30 seconds'::interval END
        );

        INSERT INTO fichadas (
            idper, fecha, hora, tipo_fichada,
            observaciones, punto, tipo_dispositivo
        ) VALUES (
            v_idper, NEW.fecha, v_hora_redondeada, v_tipo_mapeado,
            NEW.texto, texto_gps_a_punto(NEW.punto_gps), NEW.dispositivo
        );

        NEW.migrado_estado := 'OK';
        NEW.migrado_log := 'Migrado exitosamente';

    EXCEPTION WHEN OTHERS THEN
        NEW.migrado_estado := 'ERROR';
        NEW.migrado_log := SQLERRM;
    END;

    RETURN NEW;
END;
$$;

-- install/function_registrar_fichadas.sql (cambia: punto se convierte con texto_gps_a_punto)
CREATE OR REPLACE FUNCTION registrar_fichadas(
    p_data_json_text TEXT -- La entrada es TEXT (cadena JSON)
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    -- Variables de control de Bitácora y Estado
    v_bitacora_id BIGINT;
    v_start_time TIMESTAMP WITH TIME ZONE := now();
    v_has_error BOOLEAN := FALSE;
    v_end_status TEXT := 'OK';
    v_error_message TEXT;

    v_status_code INTEGER := 200;

    -- Contadores
    v_cant_insertadas INTEGER := 0;
    v_cant_procesadas INTEGER := 0;
    v_cant_fallidas INTEGER := 0;
    v_fallidas JSONB := '[]'::jsonb;

    v_username TEXT := current_user;
    v_fichadas_array jsonb;
    v_is_structurally_valid BOOLEAN := TRUE;
    v_is_enabled BOOLEAN;

    v_fichada JSONB;
    v_idx INTEGER := 0;
    v_fallas_condensed TEXT := '';
    v_resultado jsonb;

    v_fixed_machine_id CONSTANT TEXT := 'proceso bp';
    v_fixed_navigator CONSTANT TEXT := 'app fichadas';

BEGIN

    -- -------------------------------------------------------------------
    -- CHEQUEO PREVIO 1: Casteo del TEXT de entrada a JSONB (Directo a v_fichadas_array)
    -- -------------------------------------------------------------------
    BEGIN
        v_fichadas_array := p_data_json_text::jsonb;
    EXCEPTION
        WHEN data_exception THEN
            -- Manejo de error si el texto no es JSON válido (Error 400)
            v_resultado := jsonb_build_object('status', 'ERROR', 'code', 400, 'message', 'El formato de entrada no es JSON válido.', 'cant_procesadas', 0, 'cant_insertadas', 0, 'cant_fallidas', 0, 'fallidas', '[]'::jsonb);
            RETURN v_resultado;
    END;

    -- -------------------------------------------------------------------
    -- CHEQUEO PREVIO 2: Validación Estructural (Debe ser un array)
    -- -------------------------------------------------------------------

    -- La asignación v_fichadas_array := v_data_json ha sido removida/fusionada con el paso 1.

    IF jsonb_typeof(v_fichadas_array) <> 'array' THEN
        v_is_structurally_valid := FALSE;
        v_has_error := TRUE;
        v_status_code := 400;
        v_end_status := '400 BAD REQUEST: La entrada JSON debe ser un array de fichadas.';
        v_error_message := 'Fallo en el formato de entrada (se esperaba un array).';
        v_cant_procesadas := 0;

    ELSE
        SELECT jsonb_array_length(v_fichadas_array) INTO v_cant_procesadas;
    END IF;

    -- -------------------------------------------------------------------
    -- PASO 1: REGISTRO INICIAL EN BITÁCORA
    -- -------------------------------------------------------------------
    INSERT INTO his.bitacora (
        procedure_name, parameters, username, machine_id, navigator, init_date, end_status
    ) VALUES (
        'registrar_fichadas', v_fichadas_array::TEXT, v_username, v_fixed_machine_id, v_fixed_navigator, v_start_time, 'INICIADO'
    ) RETURNING id INTO v_bitacora_id;

    -- -------------------------------------------------------------------
    -- PASO 1.5: OBTENER ESTADO DE HABILITACIÓN
    -- -------------------------------------------------------------------
    SELECT permite_cargar_fichadas
    INTO v_is_enabled
    FROM parametros
    WHERE unico_registro = TRUE;

    -- -------------------------------------------------------------------
    -- CHEQUEO DE HABILITACIÓN FUNCIONAL (Error 403)
    -- -------------------------------------------------------------------
    IF v_is_structurally_valid AND COALESCE(v_is_enabled, FALSE) IS FALSE THEN
        v_has_error := TRUE;
        v_status_code := 403;
        v_end_status := '403 FORBIDDEN: Funcionalidad de procesamiento de fichadas deshabilitada por configuración.';
        v_error_message := 'La funcionalidad de procesamiento de fichadas se encuentra deshabilitada.';
    END IF;


    -- -------------------------------------------------------------------
    -- PASO 2: LÓGICA DE INSERCIÓN Y CAPTURA DE FALLOS (Best-Effort Loop)
    -- -------------------------------------------------------------------
    IF v_is_structurally_valid AND v_status_code = 200 AND v_cant_procesadas > 0 THEN

        FOR v_fichada IN SELECT * FROM jsonb_array_elements(v_fichadas_array) LOOP
            v_idx := v_idx + 1;

            BEGIN
                INSERT INTO fichadas (
                    idper, tipo_fichada, fecha, hora, observaciones, punto, tipo_dispositivo, id_original
                )
                VALUES (
                    v_fichada->>'idper',
                    v_fichada->>'tipo_fichada',
                    (v_fichada->>'fecha')::DATE,
                    (v_fichada->>'hora')::TIME WITH TIME ZONE,
                    v_fichada->>'observaciones',
                    texto_gps_a_punto(v_fichada->>'punto'),
                    v_fichada->>'tipo_dispositivo', -- MODIFICADO: COALESCE eliminado
                    v_fichada->>'id_original'
                );

                v_cant_insertadas := v_cant_insertadas + 1;

            EXCEPTION
                WHEN OTHERS THEN
                    v_has_error := TRUE;
                    v_cant_fallidas := v_cant_fallidas + 1;

                    v_fallidas := v_fallidas || jsonb_build_object(
                        'index', v_idx,
                        'error_code', SQLSTATE,
                        'error_message', TRANSLATE(SQLERRM, chr(10), ' '),
                        'fichada_data', v_fichada
                    );

                    CONTINUE;
            END;

        END LOOP;

        IF v_cant_fallidas > 0 AND v_cant_insertadas > 0 THEN
            v_status_code := 207; -- Éxito parcial
            v_end_status := '207 PARTIAL FAILURE: ' || v_cant_fallidas || ' fallaron (' || v_cant_insertadas || ' OK).';
            v_error_message := 'Lote procesado con fallos. Revise "fallidas" y end_status de bitácora.';
        END IF;

    END IF;

    -- -------------------------------------------------------------------
    -- AJUSTE DE ESTADO FINAL (500/200/207)
    -- -------------------------------------------------------------------

    IF v_status_code = 200 AND v_cant_procesadas > 0 AND v_cant_insertadas = 0 THEN
        v_has_error := TRUE;
        v_status_code := 500;
        v_end_status := '500 ALL FAILED: Ninguna fichada pudo ser insertada.';
        v_error_message := 'Error fatal de procesamiento: Todas las fichadas del lote fallaron.';

    ELSIF v_status_code = 200 THEN
        v_end_status := format('200 OK: %s fichadas insertadas.', v_cant_insertadas);
        v_error_message := COALESCE(v_error_message, 'Lote procesado con éxito.');
    END IF;

    -- -------------------------------------------------------------------
    -- PASO 3: INCLUIR JSON DE FALLAS EN END_STATUS Y ACTUALIZAR BITÁCORA
    -- -------------------------------------------------------------------
    IF v_cant_fallidas > 0 THEN
        v_fallas_condensed := TRANSLATE(v_fallidas::TEXT, chr(10), ' ');
        v_end_status := v_end_status || ' | FALLAS_JSON: ' || v_fallas_condensed;
    END IF;

    UPDATE his.bitacora
    SET
        end_date = now(),
        has_error = v_has_error,
        end_status = v_end_status
    WHERE id = v_bitacora_id;


    -- -------------------------------------------------------------------
    -- PASO 4: PREPARAR Y RETORNAR SALIDA
    -- -------------------------------------------------------------------
    v_resultado := jsonb_build_object(
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

    RETURN v_resultado;

EXCEPTION
    -- Captura errores FATALES
    WHEN OTHERS THEN
        v_resultado := jsonb_build_object(
            'status', 'ERROR',
            'code', 500,
            'message', 'Fallo interno fatal e irrecuperable de la función: ' || SQLERRM,
            'cant_procesadas', v_cant_procesadas,
            'cant_insertadas', 0,
            'cant_fallidas', v_cant_fallidas,
            'fallidas', v_fallidas
        );

        RETURN v_resultado;
END;
$$;

-- install/puntos_compatibles.sql (nueva)
/* Indica si las fichadas con punto GPS de una persona en una fecha son compatibles
   con los puntos de referencia que corresponden al código de novedad:
     - 101 (teletrabajo): los domicilios declarados de la persona
       (per_domicilios con tipo_domicilio 'P' o 'TA' y punto calculado)
     - cualquier otro código que compara (por ahora solo 999): las sedes con para_presencial
     - los códigos que no comparan devuelven null
   Es compatible cuando para cada horario recibido (hoy: la entrada y la salida; se podría
   extender a todos los extremos del multirango de fichadas) hay alguna fichada con punto
   a media hora de ese horario y a menos de 500 metros de alguna referencia.
   Devuelve null si no recibe horarios o si alguno es desconocido (null).
   EXCEPCIÓN a la regla de no depender del código de novedad: los códigos 101 y 999 están
   hardcodeados a propósito por ahora; cuando haya más códigos que comparen, pasar esta
   configuración a campos de cod_novedades. */

CREATE OR REPLACE FUNCTION puntos_compatibles(p_idper text, p_fecha date, p_cod_nov text, p_horas time[]) RETURNS boolean
    STABLE
    LANGUAGE plpgsql
    SET search_path = siper, public
AS $BODY$
DECLARE
    c_metros_maximos   CONSTANT double precision := 500;
    c_metros_por_milla CONSTANT double precision := 1609.344; -- el operador <@> de earthdistance devuelve millas terrestres
    c_ventana          CONSTANT interval := '30 minutes';
BEGIN
    IF p_cod_nov IS NULL OR p_cod_nov NOT IN ('101', '999')
        OR p_horas IS NULL OR cardinality(p_horas) = 0
        OR array_position(p_horas, null) IS NOT NULL
    THEN
        RETURN null;
    END IF;
    RETURN (
        WITH referencias AS (
            SELECT punto FROM sedes
                WHERE p_cod_nov <> '101' AND para_presencial AND punto IS NOT NULL
            UNION ALL
            SELECT punto FROM per_domicilios
                WHERE p_cod_nov = '101' AND idper = p_idper
                  AND tipo_domicilio IN ('P', 'TA') AND punto IS NOT NULL
        )
        SELECT bool_and(EXISTS (
            SELECT 1
                FROM fichadas f
                    JOIN referencias r ON (f.punto <@> r.punto) * c_metros_por_milla <= c_metros_maximos
                WHERE f.idper = p_idper AND f.fecha = p_fecha AND f.punto IS NOT NULL
                  AND f.hora BETWEEN h - c_ventana AND h + c_ventana
        ))
        FROM unnest(p_horas) h
    );
END;
$BODY$;


update fichadas_recibidas 
  set punto_gps = (texto_gps_a_punto(punto_gps))[1] || ',' || (texto_gps_a_punto(punto_gps))[0]
  where length(punto_gps)>17;
