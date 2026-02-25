set search_path=siper;
SET ROLE siper_muleto_owner;
--SET ROLE siper_owner;

ALTER TABLE "novedades_vigentes" 
ADD COLUMN "fichadas" time_range;

ALTER TABLE "fechas" 
ADD COLUMN "fichadas_consolidadas" boolean DEFAULT false;


create table "fichadas_vigentes" (
  "idper" text, 
  "fecha" date, 
  "annio" integer generated always as (extract(year from fecha)) stored, 
  "cod_nov" text, 
  "fichadas" time_range default '(,)', 
  "horario_entrada" time, 
  "horario_salida" time
, primary key ("idper", "fecha")
);
grant select on "fichadas_vigentes" to siper_muleto;
grant all on "fichadas_vigentes" to siper_muleto_owner;


alter table "fichadas_vigentes" add constraint "idper<>''" check ("idper"<>'');
alter table "fichadas_vigentes" add constraint "cod_nov<>''" check ("cod_nov"<>'');
alter table "fichadas_vigentes" alter column "fichadas" set not null;

alter table "fichadas_vigentes" add constraint "fichadas_vigentes personas REL" foreign key ("idper") references "personas" ("idper")  on update cascade;
alter table "fichadas_vigentes" add constraint "fichadas_vigentes cod_novedades REL" foreign key ("cod_nov") references "cod_novedades" ("cod_nov")  on update cascade;

create index "idper 4 fichadas_vigentes IDX" ON "fichadas_vigentes" ("idper");
create index "cod_nov 4 fichadas_vigentes IDX" ON "fichadas_vigentes" ("cod_nov");


-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

DO
$CREATOR$
DECLARE
  v_sql text := $SQL_CON_TAG$

CREATE OR REPLACE FUNCTION novedades_calculadas/*idper**_idper**idper*/(p_desde date, p_hasta date/*idper**, p_idper text**idper*/) RETURNS SETOF novedades_vigentes
  LANGUAGE SQL STABLE
AS
$BODY$
  SELECT
      idper, fecha, 
      CASE WHEN trabajable OR nr_corridos THEN 
        coalesce(CASE WHEN fichadas_consolidadas AND nr_requiere_fichadas THEN fv_cod_nov ELSE null END, nr_cod_nov, cod_nov_pred_fecha) 
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
          fv.cod_nov as fv_cod_nov
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

-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

DO 
$CREATOR$
DECLARE
  v_sql text := $SQL_CON_TAG$

CREATE OR REPLACE PROCEDURE actualizar_novedades_vigentes/*idper**_idper**idper*/(p_desde date, p_hasta date/*idper**, p_idper text**idper*/)
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
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
$BODY$;

$SQL_CON_TAG$;
BEGIN
  v_sql := replace(v_sql,
$$
$BODY$
BEGIN
$$,
$$
$BODY$
BEGIN
-- ¡ATENCIÓN! NO MODIFICAR MANUALMENTE ESTA FUNCIÓN FUE GENERADA CON EL SCRIPT actualizar_novedades_vigentes.sql
-- Otras funciones que comienzan con el nombre actualizar_novedades_vigentes se generaron junto a esta!
$$);
  execute v_sql;
  execute replace(replace(v_sql,'/*idper**',''),'**idper*/','');
END;
$CREATOR$;

-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

/* ATENCIÓN:
 * Estos son todos los triggers (sobre fechas y personas y annios) que van a rellenar fichadas_vigentes
 * y actualizar los datos correspondientes
 */
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

CREATE TRIGGER personas_fichadas_vigentes_trg 
  AFTER INSERT OR UPDATE OF activo
  ON personas 
  FOR EACH ROW 
  EXECUTE PROCEDURE personas_fichadas_vigentes_trg();

CREATE TRIGGER annios_fichadas_vigentes_trg 
  AFTER INSERT OR UPDATE OF abierto
  ON annios 
  FOR EACH ROW 
  EXECUTE PROCEDURE annios_fichadas_vigentes_trg();

CREATE TRIGGER fechas_fichadas_vigentes_trg 
  AFTER INSERT OR UPDATE OF laborable
  ON fechas 
  FOR EACH ROW 
  EXECUTE PROCEDURE fechas_fichadas_vigentes_trg();

CREATE TRIGGER fichadas_vigentes_cod_nov_trg
  BEFORE INSERT OR UPDATE OF fichadas
  ON fichadas_vigentes
  FOR EACH ROW
  EXECUTE PROCEDURE fichadas_vigentes_cod_nov_trg();

CREATE TRIGGER fichadas_fichadas_vigentes_trg 
  AFTER INSERT OR UPDATE
  ON fichadas 
  FOR EACH ROW 
  EXECUTE PROCEDURE fichadas_fichadas_vigentes_trg();

/*
CREATE OR REPLACE FUNCTION fichadas_vigentes_novedades_vigentes_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  IF tg_op = 'INSERT' THEN
    IF new.fichadas <> '(,)' THEN
      CALL actualizar_novedades_vigentes_idper(new.fecha, new.fecha, new.idper);
    END IF;
  ELSE
    IF new.fichadas IS DISTINCT FROM old.fichadas END THEN
      CALL actualizar_novedades_vigentes_idper(new.fecha, new.fecha, new.idper);
    END IF;
  END IF;
  RETURN NEW;
END;
$BODY$;

CREATE TRIGGER fichadas_vigentes_novedades_vigentes_trg 
  AFTER INSERT OR UPDATE
  ON fichadas_vigentes
  FOR EACH ROW 
  EXECUTE PROCEDURE fichadas_vigentes_novedades_vigentes_trg();

*/

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

DROP TRIGGER IF EXISTS procesar_fichada_recibida_trg ON fichadas_recibidas;
CREATE TRIGGER procesar_fichada_recibida_trg
    BEFORE INSERT ON fichadas_recibidas
    FOR EACH ROW
    EXECUTE PROCEDURE procesar_fichada_recibida_trg();


