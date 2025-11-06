SET ROLE siper_owner;
set search_path = siper;

-- ===== tablas =====
ALTER TABLE fichadas ADD COLUMN annio            integer;
ALTER TABLE fichadas ADD COLUMN id_fichada       bigint;
ALTER TABLE fichadas ADD COLUMN tipo_fichada     text;
ALTER TABLE fichadas ADD COLUMN observaciones    text;
ALTER TABLE fichadas ADD COLUMN punto            text;
ALTER TABLE fichadas ADD COLUMN tipo_dispositivo text;
ALTER TABLE fichadas ADD COLUMN id_original      text;
ALTER TABLE fichadas DROP COLUMN origen;


ALTER TABLE cod_novedades ADD COLUMN pierde_presentismo boolean;
ALTER TABLE cod_novedades ADD COLUMN cuenta_horas boolean;
ALTER TABLE cod_novedades ADD COLUMN requiere_fichadas boolean;
ALTER TABLE cod_novedades ADD COLUMN requiere_entrada boolean;
ALTER TABLE cod_novedades ADD COLUMN umbral_posterior_entrada integer;
ALTER TABLE cod_novedades ADD COLUMN umbral_anterior_salida integer;
ALTER TABLE cod_novedades ADD COLUMN requiere_ninguna_fichada boolean;
ALTER TABLE cod_novedades ADD COLUMN necesita_verificacion_manual boolean;
ALTER TABLE cod_novedades ADD COLUMN eximido_fichar boolean;

ALTER TABLE bandas_horarias ADD COLUMN umbral_aviso_falta_entrada integer;
ALTER TABLE bandas_horarias ADD COLUMN umbral_aviso_falta_salida integer;

alter table parametros add column permite_cargar_fichadas boolean default true;
alter table "parametros" add check (permite_cargar_fichadas is not false);


create table "tipos_fichada" (
  "tipo_fichada" text, 
  "nombre" text, 
  "orden" integer
, primary key ("tipo_fichada")
);
grant select, insert, update, delete on "tipos_fichada" to siper_admin;
grant all on "tipos_fichada" to siper_owner;

alter table "tipos_fichada" add constraint "tipo_fichada<>''" check ("tipo_fichada"<>'');
alter table "tipos_fichada" add constraint "nombre<>''" check ("nombre"<>'');
alter table "tipos_fichada" alter column "nombre" set not null;
alter table "tipos_fichada" alter column "orden" set not null;


insert into "tipos_fichada" ("tipo_fichada", "nombre", "orden") values
('E', 'ENTRADA', 10),
('S', 'SALIDA', 20),
('O', 'OTROS', 30);


update fichadas set tipo_fichada = 'O';

alter table "fichadas" alter column "tipo_fichada" set not null;

-- ===== sequence id_fichada (arranca en 101) =====
CREATE SEQUENCE "id_fichada_seq" START 101;
ALTER TABLE "fichadas" ALTER COLUMN "id_fichada" SET DEFAULT nextval('id_fichada_seq'::regclass);
GRANT USAGE, SELECT ON SEQUENCE "id_fichada_seq" TO siper_admin;

-- completar filas existentes y restringir
UPDATE fichadas SET id_fichada = DEFAULT WHERE id_fichada IS NULL;
ALTER TABLE fichadas ALTER COLUMN id_fichada SET NOT NULL;

-- ===== agregar id_fichada a pk =====
ALTER TABLE fichadas DROP CONSTRAINT fichadas_pkey;
ALTER TABLE fichadas ADD CONSTRAINT fichadas_pkey PRIMARY KEY (idper, fecha, hora, id_fichada );

-- ===== CONS =====
alter table "fichadas" add constraint "tipo_fichada<>''" check ("tipo_fichada"<>'');
alter table "fichadas" add constraint "observaciones<>''" check ("observaciones"<>'');
alter table "fichadas" add constraint "punto<>''" check ("punto"<>'');
alter table "fichadas" add constraint "tipo_dispositivo<>''" check ("tipo_dispositivo"<>'');
alter table "fichadas" add constraint "id_original<>''" check ("id_original"<>'');
alter table "fichadas" add constraint "fichadas tipos_fichada REL" foreign key ("tipo_fichada") references "tipos_fichada" ("tipo_fichada")  on update cascade;


-- ===== index =====
CREATE INDEX "tipo_fichada 4 fichadas IDX" ON "fichadas" ("tipo_fichada");


-- ===== Nuevas tablas =====
create table "reglas" (
  "annio" integer, 
  "codnov_unica_fichada" text, 
  "codnov_sin_fichadas" text, 
  "umbral_horas_mensuales" integer, 
  "umbral_horas_diarias" integer, 
  "umbral_horas_semanales" integer, 
  "umbral_horas_personales" integer, 
  "horario_consolidado" time, 
  "minimas_horas_diarias_declaradas" integer, 
  "maximas_horas_diarias_declaradas" integer
, primary key ("annio")
);
grant select on "reglas" to siper_admin;
grant all on "reglas" to siper_owner;


create table "avisos_falta_fichada" (
  "idper" text, 
  "fecha" date, 
  "tipo_fichada" text, 
  "avisado_wp" time, 
  "avisado_mail" time, 
  "llegada_novedad" time
, primary key ("idper", "fecha", "tipo_fichada")
);
grant select on "avisos_falta_fichada" to siper_admin;
grant all on "avisos_falta_fichada" to siper_owner;

-- ===== cons =====
alter table "reglas" add constraint "codnov_unica_fichada<>''" check ("codnov_unica_fichada"<>'');
alter table "reglas" add constraint "codnov_sin_fichadas<>''" check ("codnov_sin_fichadas"<>'');
alter table "avisos_falta_fichada" add constraint "idper<>''" check ("idper"<>'');
alter table "avisos_falta_fichada" add constraint "tipo_fichada<>''" check ("tipo_fichada"<>'');


alter table "avisos_falta_fichada" add constraint "avisos_falta_fichada personas REL" foreign key ("idper") references "personas" ("idper")  on update cascade;

-- ===== index =====
create index "idper 4 avisos_falta_fichada IDX" ON "avisos_falta_fichada" ("idper");


do $SQL_ENANCE$
 begin
PERFORM enance_table('reglas','annio');
PERFORM enance_table('avisos_falta_fichada','idper,fecha,tipo_fichada');
end
$SQL_ENANCE$;


-- ===== FUNCION registrar_fichadas =====

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
                    v_fichada->>'punto',
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