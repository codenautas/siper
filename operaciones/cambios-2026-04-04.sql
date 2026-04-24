set role to siper_muleto_owner; -- set role to siper_owner;
set search_path = siper;

CREATE SEQUENCE siper.sinc_usuarios_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


CREATE SEQUENCE siper.id_fichada
    START WITH 100
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE siper.fichadas_recibidas (
    dispositivo text,
    fecha date NOT NULL,
    fichador text NOT NULL,
    hora time without time zone NOT NULL,
    id_fichada bigint DEFAULT nextval('siper.id_fichada'::regclass) NOT NULL,
    id_origen text,
    migrado_estado text DEFAULT 'ANTERIOR_A_TRIGGER'::text NOT NULL,
    migrado_log text,
    punto_gps text,
    recepcion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    texto text,
    tipo text NOT NULL,
    CONSTRAINT "tipo<>''" CHECK ((tipo <> ''::text))
);


CREATE TABLE siper.fichadas_vigentes (
    annio integer GENERATED ALWAYS AS (EXTRACT(year FROM fecha)) STORED,
    cod_nov text,
    fecha date NOT NULL,
    fichadas siper.time_range DEFAULT '(,)'::siper.time_range NOT NULL,
    horario_entrada time without time zone,
    horario_salida time without time zone,
    idper text NOT NULL,
    CONSTRAINT "cod_nov<>''" CHECK ((cod_nov <> ''::text)),
    CONSTRAINT "idper<>''" CHECK ((idper <> ''::text))
);

CREATE TABLE siper.sinc_fichadores (
    accion text NOT NULL,
    actualizado_en timestamp without time zone,
    creado_en timestamp without time zone,
    estado text NOT NULL,
    intentos integer DEFAULT 0 NOT NULL,
    num_sincro bigint DEFAULT nextval('siper.sinc_usuarios_seq'::regclass) NOT NULL,
    parametros text,
    respuesta_sp text,
    usuario text NOT NULL,
    CONSTRAINT "accion<>''" CHECK ((accion <> ''::text)),
    CONSTRAINT acciones_cola CHECK ((accion = ANY (ARRAY['DESACTIVAR'::text, 'ACTUALIZAR'::text]))),
    CONSTRAINT "estado<>''" CHECK ((estado <> ''::text)),
    CONSTRAINT estados_cola CHECK ((estado = ANY (ARRAY['PENDIENTE'::text, 'EN_PROCESO'::text, 'PROCESADO'::text, 'ERROR'::text, 'AGOTADO'::text]))),
    CONSTRAINT "parametros<>''" CHECK ((parametros <> ''::text)),
    CONSTRAINT "respuesta_sp<>''" CHECK ((respuesta_sp <> ''::text))
);

CREATE TYPE siper.novedades_calculadas_return AS (
	idper text,
	fecha date,
	cod_nov text,
	ficha text,
	fichadas siper.time_range,
	sector text,
	annio integer,
	trabajable boolean,
	detalles text,
	cod_nov_ini text
);

CREATE OR REPLACE FUNCTION siper.annio_preparar(p_annio integer) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS 
$$
BEGIN
  INSERT INTO annios (annio, abierto, anterior) VALUES (p_annio, false, (SELECT annio FROM annios WHERE annio = p_annio - 1 ));
  INSERT INTO fechas (fecha) 
    SELECT d FROM generate_series(make_date(p_annio,1,1), make_date(p_annio,12,31), '1 day'::INTERVAL) d;
END;
$$;

ALTER TABLE siper.fechas ADD COLUMN fichadas_consolidadas boolean DEFAULT false;

ALTER TABLE siper.personas ADD COLUMN inicia_fichada date;

CREATE OR REPLACE FUNCTION personas_fichadas_vigentes_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  IF new.activo THEN
    INSERT INTO fichadas_vigentes (idper, fecha)
      SELECT new.idper, fecha
        FROM fechas f
          INNER JOIN annios a USING (annio)
        WHERE a.abierto
      ON CONFLICT DO NOTHING;
    UPDATE fichadas_vigentes fv
      SET fichadas = rango_simple_fichadas(fv.idper, fv.fecha)
      FROM annios a 
      WHERE fv.idper = new.idper
        AND fv.annio = a.annio
        AND a.abierto;
  END IF;
  RETURN NEW;
END;
$BODY$;

CREATE OR REPLACE FUNCTION annios_fichadas_vigentes_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  IF new.abierto THEN
    INSERT INTO fichadas_vigentes (idper, fecha)
      SELECT idper, fecha
        FROM fechas f, personas p
        WHERE f.annio = new.annio
          AND p.activo
      ON CONFLICT DO NOTHING;
    UPDATE fichadas_vigentes fv
      SET fichadas = rango_simple_fichadas(fv.idper, fv.fecha)
      FROM personas p
      WHERE fv.annio = new.annio
        AND fv.idper = p.idper
        AND p.activo;
  END IF;
  RETURN NEW;
END;
$BODY$;

CREATE OR REPLACE FUNCTION fechas_fichadas_vigentes_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  IF new.annio IS NOT NULL THEN
    INSERT INTO fichadas_vigentes (idper, fecha)
      SELECT idper, new.fecha
        FROM personas p
        WHERE p.activo
      ON CONFLICT DO NOTHING;
    UPDATE fichadas_vigentes fv
      SET fichadas = rango_simple_fichadas(fv.idper, fv.fecha)
      FROM personas p, annios a
      WHERE fv.fecha = new.fecha
        AND fv.annio = a.annio
        AND fv.idper = p.idper
        AND a.abierto
        AND p.activo;
  END IF;
  RETURN NEW;
END;
$BODY$;

CREATE OR REPLACE FUNCTION fichadas_fichadas_vigentes_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  INSERT INTO fichadas_vigentes (idper, fecha)
    VALUES (new.idper, new.fecha)
    ON CONFLICT DO NOTHING;
  UPDATE fichadas_vigentes
    SET fichadas = rango_simple_fichadas(idper, fecha)
    WHERE idper = new.idper
      AND fecha = new.fecha;
  RETURN new;
END;
$BODY$;

CREATE OR REPLACE FUNCTION fichadas_vigentes_cod_nov_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE plpgsql
AS
$BODY$
DECLARE
  v_annio integer := EXTRACT(YEAR FROM new.fecha);
  v_annio_abierto boolean;
  v_regla RECORD;
BEGIN
  SELECT a.abierto
    INTO v_annio_abierto
    FROM annios a
   WHERE a.annio = v_annio;
  IF v_annio_abierto THEN
    SELECT *
      INTO v_regla
      FROM reglas
      WHERE annio = v_annio;
    IF lower(new.fichadas) IS NULL AND upper(new.fichadas) IS NULL THEN
      NEW.cod_nov := v_regla.codnov_sin_fichadas;
    ELSIF lower(new.fichadas) IS NULL OR upper(new.fichadas) IS NULL THEN
      NEW.cod_nov := v_regla.codnov_unica_fichada;
    ELSE
      NEW.cod_nov := NULL;
    END IF;
  END IF;
  IF tg_op = 'INSERT' THEN
    IF new.fichadas <> '(,)' THEN
      CALL actualizar_novedades_vigentes_idper(new.fecha, new.fecha, new.idper);
    END IF;
  ELSE
    IF new.fichadas IS DISTINCT FROM old.fichadas THEN
      CALL actualizar_novedades_vigentes_idper(new.fecha, new.fecha, new.idper);
    END IF;
  END IF;
  RETURN NEW;
END;
$BODY$;

CREATE OR REPLACE FUNCTION rango_simple_fichadas(p_idper text, p_fecha date) 
  RETURNS time_range 
  STABLE LANGUAGE SQL
AS
$sql$
  WITH horas_entrada_salida as (
    SELECT 
        MIN(hora) FILTER (WHERE tipo_fichada = 'E') as hora_entrada,
        MAX(hora) FILTER (WHERE tipo_fichada = 'S') as hora_salida
      FROM fichadas f 
      WHERE f.fecha = p_fecha AND f.idper = p_idper
  )
  SELECT time_range(
      CASE WHEN hora_entrada < bh.hora_desde THEN bh.hora_desde ELSE hora_entrada END,
      CASE WHEN hora_salida  > bh.hora_hasta THEN bh.hora_hasta ELSE hora_salida  END
    )
    FROM horas_entrada_salida, 
        personas p 
          INNER JOIN bandas_horarias bh USING (banda_horaria)
      WHERE p.idper = p_idper;
$sql$;


DROP FUNCTION novedades_calculadas(date, date);
DROP FUNCTION novedades_calculadas_idper(date, date, text);


DO
$CREATOR$
DECLARE
  v_sql text := $SQL_CON_TAG$

CREATE OR REPLACE FUNCTION novedades_calculadas/*idper**_idper**idper*/(p_desde date, p_hasta date/*idper**, p_idper text**idper*/) RETURNS SETOF novedades_calculadas_return
  LANGUAGE SQL STABLE
AS
$BODY$
  SELECT
      idper, fecha, 
      CASE WHEN trabajable OR nr_corridos THEN 
        coalesce(CASE WHEN fichadas_consolidadas AND nr_requiere_fichadas AND fecha >= fecha_inicio_fichada THEN fv_cod_nov ELSE null END, nr_cod_nov, cod_nov_pred_fecha) 
      ELSE null END as cod_nov, 
      ficha, fichadas, sector, annio,
      trabajable, detalles, cod_nov_ini
    FROM (
      SELECT p.idper, p.ficha, f.fecha, f.fichadas_consolidadas,
          (f.dds BETWEEN 1 AND 5) AND (laborable is not false OR inamovible is not true AND f.dds NOT BETWEEN 1 AND 5) as trabajable,
          p.sector, f.annio, nr.detalles,
          CASE WHEN (nr.c_dds IS NOT TRUE -- FILTRO PARA DIAGRAMADO POR DIA DE SEMANA:
            OR CASE extract(DOW from f.fecha) WHEN 0 THEN nr.dds0 WHEN 1 THEN nr.dds1 WHEN 2 THEN nr.dds2 WHEN 3 THEN nr.dds3 WHEN 4 THEN nr.dds4 WHEN 5 THEN nr.dds5 WHEN 6 THEN nr.dds6 END
          ) THEN nr.cod_nov ELSE null END as nr_cod_nov,
          COALESCE(nr.requiere_fichadas, nr.cod_nov IS NULL) as nr_requiere_fichadas,
          nr.corridos as nr_corridos,
          cod_nov_pred_fecha, 
          ni.cod_nov as cod_nov_ini,
          fv.fichadas,
          fv.cod_nov as fv_cod_nov,
          COALESCE(p.inicia_fichada, p.registra_novedades_desde) as fecha_inicio_fichada
        FROM fechas f INNER JOIN annios a USING (annio) CROSS JOIN personas p
          LEFT JOIN fichadas_vigentes fv USING (idper, fecha)
          LEFT JOIN LATERAL (
            SELECT nr.cod_nov, cn.corridos, nr.detalles, cn.requiere_fichadas, 
                dds0, dds1, dds2, dds3, dds4, dds5, dds6, cn.c_dds
              FROM novedades_registradas nr LEFT JOIN cod_novedades cn ON nr.cod_nov = cn.cod_nov
              LEFT JOIN tipos_novedad tn USING (tipo_novedad)
              WHERE f.fecha BETWEEN nr.desde AND nr.hasta
                AND p.idper = nr.idper                
              ORDER BY tn.orden, nr.idr DESC LIMIT 1
          ) nr ON true
          LEFT JOIN LATERAL (
            SELECT nr.cod_nov, cn.corridos, nr.detalles, 
                dds0, dds1, dds2, dds3, dds4, dds5, dds6, cn.c_dds
              FROM novedades_registradas nr LEFT JOIN cod_novedades cn ON nr.cod_nov = cn.cod_nov
              WHERE f.fecha BETWEEN nr.desde AND nr.hasta
                AND p.idper = nr.idper
                AND nr.tipo_novedad = 'I'
              ORDER BY nr.idr DESC LIMIT 1
          ) ni ON true -- novedad inicial
        WHERE f.fecha BETWEEN p_desde AND p_hasta
          AND f.fecha <= COALESCE(p.fecha_egreso, '2999-12-31'::date)
          AND f.fecha >= p.registra_novedades_desde           
          /*idper**AND p.idper = p_idper**idper*/
      ) x
$BODY$;

$SQL_CON_TAG$;
BEGIN
  v_sql := replace(v_sql,
$$
$BODY$
  SELECT
$$, $$
$BODY$
  SELECT
-- ¡ATENCIÓN! NO MODIFICAR MANUALMENTE ESTA FUNCIÓN FUE GENERADA CON EL SCRIPT novedades_calculadas.sql
-- Otras funciones que comienzan con el nombre novedades_calculadas se generaron junto a esta!
$$);
  execute v_sql;
  execute replace(replace(v_sql,'/*idper**',''),'**idper*/','');
END;
$CREATOR$;

ALTER TABLE siper.fichadas_recibidas DROP CONSTRAINT IF EXISTS "ficha<>''";
ALTER TABLE siper.fichadas_recibidas DROP CONSTRAINT IF EXISTS "idper<>''";
ALTER TABLE siper.fichadas_recibidas DROP COLUMN IF EXISTS ficha;

ALTER TABLE siper.novedades_vigentes DROP CONSTRAINT "ent_fich<>''";
ALTER TABLE siper.novedades_vigentes DROP CONSTRAINT "sal_fich<>''";
ALTER TABLE siper.novedades_vigentes DROP COLUMN ent_fich;
ALTER TABLE siper.novedades_vigentes DROP COLUMN sal_fich;

CREATE VIEW siper.personal_con_fichada AS
 SELECT p.idper,
    p.apellido,
    p.nombres,
    p.documento,
    u.hashpass
   FROM (siper.personas p
     JOIN siper.usuarios u USING (idper))
  WHERE ((u.algoritmo_pass = 'PG-SHA256'::text) AND u.activo AND p.activo);



ALTER TABLE ONLY siper.sinc_fichadores ADD CONSTRAINT sinc_fichadores_pkey PRIMARY KEY (num_sincro);

create or replace procedure avance_de_dia_proc()
  language sql
  security definer
begin atomic
  UPDATE fechas f
    SET cod_nov_pred_fecha = cod_nov_habitual
    FROM parametros, annios a
    WHERE cod_nov_pred_fecha is null
      AND fecha <= fecha_actual()
      AND f.annio = a.annio
      AND a.abierto;
end;

CREATE OR REPLACE FUNCTION parametros_avance_dia_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  CALL avance_de_dia_proc();
  RETURN new;
END;
$BODY$;

DROP TRIGGER IF EXISTS parametros_avance_dia_trg on parametros;
CREATE TRIGGER parametros_avance_dia_trg
  AFTER UPDATE OF fecha_hora_para_test
  ON parametros
  FOR EACH ROW
  EXECUTE PROCEDURE parametros_avance_dia_trg();

CREATE FUNCTION siper.fn_trigger_sincro_usuarios_modulo() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
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
        INSERT INTO siper.sinc_fichadores (usuario, accion, estado, creado_en, actualizado_en)
        VALUES (OLD.usuario, 'DESACTIVAR', 'PENDIENTE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        ON CONFLICT (usuario) WHERE (estado != 'PROCESADO')
        DO UPDATE SET accion = 'DESACTIVAR', estado = 'PENDIENTE', actualizado_en = NOW(), intentos = 0, respuesta_sp = null;
    END IF;

    -- Acción para el usuario ACTUAL (Alta, Modificación, Baja o Desvínculo)
    IF (v_debe_procesar_actual) THEN
        INSERT INTO siper.sinc_fichadores (usuario, accion, estado, creado_en, actualizado_en)
        VALUES (CASE WHEN TG_OP = 'DELETE' THEN OLD.usuario ELSE NEW.usuario END, v_accion_actual, 'PENDIENTE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        ON CONFLICT (usuario) WHERE (estado != 'PROCESADO')
        DO UPDATE SET accion = v_accion_actual, estado = 'PENDIENTE', actualizado_en = NOW(), intentos = 0, respuesta_sp = null;
    END IF;

    RETURN NULL;
END;
$$;



CREATE FUNCTION siper.procesar_fichada_recibida_trg() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'siper'
    AS $$
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
            NEW.texto, NEW.punto_gps, NEW.dispositivo
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


CREATE OR REPLACE PROCEDURE siper.actualizar_novedades_vigentes_idper(IN p_desde date, IN p_hasta date, IN p_idper text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
-- ¡ATENCIÓN! NO MODIFICAR MANUALMENTE ESTA FUNCIÓN FUE GENERADA CON EL SCRIPT actualizar_novedades_vigentes.sql
-- Otras funciones que comienzan con el nombre actualizar_novedades_vigentes se generaron junto a esta!
MERGE INTO novedades_vigentes nv 
  USING novedades_calculadas_idper(p_desde, p_hasta, p_idper) q
    ON nv.idper = q.idper AND nv.fecha = q.fecha
  WHEN MATCHED AND 
      (nv.ficha IS DISTINCT FROM q.ficha 
      OR nv.cod_nov IS DISTINCT FROM q.cod_nov 
      OR nv.fichadas IS DISTINCT FROM q.fichadas
      OR nv.sector IS DISTINCT FROM q.sector
      OR nv.detalles IS DISTINCT FROM q.detalles
      OR nv.trabajable IS DISTINCT FROM q.trabajable
      OR nv.cod_nov_ini IS DISTINCT FROM q.cod_nov_ini
      ) THEN
    UPDATE SET ficha = q.ficha, cod_nov = q.cod_nov, fichadas = q.fichadas, sector = q.sector, detalles = q.detalles,
      trabajable = q.trabajable, cod_nov_ini = q.cod_nov_ini
  WHEN NOT MATCHED THEN
    INSERT   (  idper,   ficha,   fecha,   cod_nov,   fichadas,   sector,   detalles,   trabajable,   cod_nov_ini)
      VALUES (q.idper, q.ficha, q.fecha, q.cod_nov, q.fichadas, q.sector, q.detalles, q.trabajable, q.cod_nov_ini)
  WHEN NOT MATCHED BY SOURCE AND nv.fecha BETWEEN p_desde AND p_hasta AND nv.idper = p_idper THEN DELETE;
END;
$$;

ALTER TABLE siper.novedades_vigentes ADD COLUMN fichadas siper.time_range;


ALTER TABLE ONLY siper.fichadas_recibidas
    ADD CONSTRAINT fichadas_recibidas_pkey PRIMARY KEY (id_fichada);


ALTER TABLE ONLY siper.fichadas_vigentes
    ADD CONSTRAINT fichadas_vigentes_pkey PRIMARY KEY (idper, fecha);

ALTER TABLE ONLY siper.fichadas_vigentes
    ADD CONSTRAINT "fichadas_vigentes cod_novedades REL" FOREIGN KEY (cod_nov) REFERENCES siper.cod_novedades(cod_nov) ON UPDATE CASCADE;


ALTER TABLE ONLY siper.fichadas_vigentes
    ADD CONSTRAINT "fichadas_vigentes personas REL" FOREIGN KEY (idper) REFERENCES siper.personas(idper) ON UPDATE CASCADE;
CREATE INDEX "cod_nov 4 fichadas_vigentes IDX" ON siper.fichadas_vigentes USING btree (cod_nov);

CREATE INDEX "idper 4 fichadas_vigentes IDX" ON siper.fichadas_vigentes USING btree (idper);
CREATE UNIQUE INDEX idx_usuario_activo_sincro ON siper.sinc_fichadores USING btree (usuario) WHERE (estado <> 'PROCESADO'::text);
CREATE TRIGGER annios_fichadas_vigentes_trg AFTER INSERT OR UPDATE OF abierto ON siper.annios FOR EACH ROW EXECUTE FUNCTION siper.annios_fichadas_vigentes_trg();
CREATE TRIGGER fechas_fichadas_vigentes_trg AFTER INSERT OR UPDATE OF laborable ON siper.fechas FOR EACH ROW EXECUTE FUNCTION siper.fechas_fichadas_vigentes_trg();

CREATE TRIGGER procesar_fichada_recibida_trg BEFORE INSERT ON siper.fichadas_recibidas FOR EACH ROW EXECUTE FUNCTION siper.procesar_fichada_recibida_trg();


CREATE TRIGGER fichadas_vigentes_cod_nov_trg BEFORE INSERT OR UPDATE OF fichadas ON siper.fichadas_vigentes FOR EACH ROW EXECUTE FUNCTION siper.fichadas_vigentes_cod_nov_trg();
CREATE TRIGGER fichadas_fichadas_vigentes_trg AFTER INSERT OR UPDATE ON siper.fichadas FOR EACH ROW EXECUTE FUNCTION siper.fichadas_fichadas_vigentes_trg();
CREATE TRIGGER personas_fichadas_vigentes_trg AFTER INSERT OR UPDATE OF activo ON siper.personas FOR EACH ROW EXECUTE FUNCTION siper.personas_fichadas_vigentes_trg();
CREATE TRIGGER tr_sincro_usuarios_modulo_global AFTER INSERT OR DELETE OR UPDATE OF usuario, activo, hashpass, idper ON siper.usuarios FOR EACH ROW EXECUTE FUNCTION siper.fn_trigger_sincro_usuarios_modulo();

GRANT USAGE ON SCHEMA siper TO siper_modulo_fichador;


GRANT DELETE ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE siper.fichadas_recibidas TO siper_muleto_admin;

GRANT SELECT(id_fichada) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(fichador),INSERT(fichador),UPDATE(fichador) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(fecha),INSERT(fecha),UPDATE(fecha) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(hora),INSERT(hora),UPDATE(hora) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(tipo),INSERT(tipo),UPDATE(tipo) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(texto),INSERT(texto),UPDATE(texto) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(dispositivo),INSERT(dispositivo),UPDATE(dispositivo) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(punto_gps),INSERT(punto_gps),UPDATE(punto_gps) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(id_origen),INSERT(id_origen),UPDATE(id_origen) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT(recepcion) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;


GRANT SELECT ON TABLE siper.fichadas_vigentes TO siper_muleto_admin;

GRANT SELECT,USAGE ON SEQUENCE siper.id_fichada TO siper_muleto_admin;
GRANT SELECT,USAGE ON SEQUENCE siper.id_fichada TO siper_modulo_fichador;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE siper.personal_con_fichada TO siper_modulo_fichador;

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE siper.sinc_fichadores TO siper_muleto_admin;


GRANT SELECT,USAGE ON SEQUENCE siper.sinc_usuarios_seq TO siper_muleto_admin;

CREATE OR REPLACE PROCEDURE siper.actualizar_novedades_vigentes(IN p_desde date, IN p_hasta date)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
-- ¡ATENCIÓN! NO MODIFICAR MANUALMENTE ESTA FUNCIÓN FUE GENERADA CON EL SCRIPT actualizar_novedades_vigentes.sql
-- Otras funciones que comienzan con el nombre actualizar_novedades_vigentes se generaron junto a esta!
MERGE INTO novedades_vigentes nv 
  USING novedades_calculadas/*idper**_idper**idper*/(p_desde, p_hasta/*idper**, p_idper**idper*/) q
    ON nv.idper = q.idper AND nv.fecha = q.fecha
  WHEN MATCHED AND 
      (nv.ficha IS DISTINCT FROM q.ficha 
      OR nv.cod_nov IS DISTINCT FROM q.cod_nov 
      OR nv.fichadas IS DISTINCT FROM q.fichadas
      OR nv.sector IS DISTINCT FROM q.sector
      OR nv.detalles IS DISTINCT FROM q.detalles
      OR nv.trabajable IS DISTINCT FROM q.trabajable
      OR nv.cod_nov_ini IS DISTINCT FROM q.cod_nov_ini
      ) THEN
    UPDATE SET ficha = q.ficha, cod_nov = q.cod_nov, fichadas = q.fichadas, sector = q.sector, detalles = q.detalles,
      trabajable = q.trabajable, cod_nov_ini = q.cod_nov_ini
  WHEN NOT MATCHED THEN
    INSERT   (  idper,   ficha,   fecha,   cod_nov,   fichadas,   sector,   detalles,   trabajable,   cod_nov_ini)
      VALUES (q.idper, q.ficha, q.fecha, q.cod_nov, q.fichadas, q.sector, q.detalles, q.trabajable, q.cod_nov_ini)
  WHEN NOT MATCHED BY SOURCE AND nv.fecha BETWEEN p_desde AND p_hasta/*idper** AND nv.idper = p_idper**idper*/ THEN DELETE;
END;
$$;

CREATE OR REPLACE PROCEDURE siper.actualizar_novedades_vigentes_idper(IN p_desde date, IN p_hasta date, IN p_idper text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
-- ¡ATENCIÓN! NO MODIFICAR MANUALMENTE ESTA FUNCIÓN FUE GENERADA CON EL SCRIPT actualizar_novedades_vigentes.sql
-- Otras funciones que comienzan con el nombre actualizar_novedades_vigentes se generaron junto a esta!
MERGE INTO novedades_vigentes nv 
  USING novedades_calculadas_idper(p_desde, p_hasta, p_idper) q
    ON nv.idper = q.idper AND nv.fecha = q.fecha
  WHEN MATCHED AND 
      (nv.ficha IS DISTINCT FROM q.ficha 
      OR nv.cod_nov IS DISTINCT FROM q.cod_nov 
      OR nv.fichadas IS DISTINCT FROM q.fichadas
      OR nv.sector IS DISTINCT FROM q.sector
      OR nv.detalles IS DISTINCT FROM q.detalles
      OR nv.trabajable IS DISTINCT FROM q.trabajable
      OR nv.cod_nov_ini IS DISTINCT FROM q.cod_nov_ini
      ) THEN
    UPDATE SET ficha = q.ficha, cod_nov = q.cod_nov, fichadas = q.fichadas, sector = q.sector, detalles = q.detalles,
      trabajable = q.trabajable, cod_nov_ini = q.cod_nov_ini
  WHEN NOT MATCHED THEN
    INSERT   (  idper,   ficha,   fecha,   cod_nov,   fichadas,   sector,   detalles,   trabajable,   cod_nov_ini)
      VALUES (q.idper, q.ficha, q.fecha, q.cod_nov, q.fichadas, q.sector, q.detalles, q.trabajable, q.cod_nov_ini)
  WHEN NOT MATCHED BY SOURCE AND nv.fecha BETWEEN p_desde AND p_hasta AND nv.idper = p_idper THEN DELETE;
END;
$$;

ALTER TABLE usuarios ADD COLUMN principal boolean DEFAULT true;

GRANT SELECT(id_fichada) ON TABLE siper.fichadas_recibidas TO siper_modulo_fichador;

ALTER TABLE reglas ADD COLUMN tolerancia_consolidacion integer;

INSERT INTO fichadas_vigentes (idper, fecha)
  SELECT idper, fecha
    FROM fechas, personas p
    WHERE laborable is not false
      AND p.activo
      AND annio=2026
    ON CONFLICT DO NOTHING;
