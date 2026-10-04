-- Agrega cod_presencialidad a novedades_vigentes: el código de novedad que quedó tapado por el código de las fichadas
set role to siper_muleto_owner;
set search_path = siper;

alter table "novedades_vigentes" add column "cod_presencialidad" text;
alter table "novedades_vigentes" add constraint "cod_presencialidad<>''" check ("cod_presencialidad"<>'');
alter table "novedades_vigentes" drop constraint if exists "novedades_vigentes cnf REL";
alter table "novedades_vigentes" add constraint "novedades_vigentes cnf REL" foreign key ("cod_presencialidad") references "cod_novedades" ("cod_nov")  on update cascade;
create index "cod_presencialidad 4 novedades_vigentes IDX" ON "novedades_vigentes" ("cod_presencialidad");

DROP FUNCTION novedades_calculadas(date, date);
DROP FUNCTION novedades_calculadas_idper(date, date, text);

DROP TYPE novedades_calculadas_return;

CREATE TYPE novedades_calculadas_return AS (
  idper text,
  fecha date,
  cod_nov text,
  ficha text,
  fichadas time_multirange,
  sector text,
  annio integer,
  trabajable boolean,
  detalles text,
  cod_nov_ini text,
  horas interval,
  cod_presencialidad text
);

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
      trabajable, detalles, cod_nov_ini,
      CASE WHEN fichadas_consolidadas AND nr_cuenta_horas AND trabajable AND fecha >= fecha_inicio_fichada THEN duration(fichadas) ELSE null END as horas,
      CASE WHEN (trabajable OR nr_corridos) AND fichadas_consolidadas AND nr_requiere_fichadas AND fecha >= fecha_inicio_fichada AND fv_cod_nov IS NOT NULL THEN
        coalesce(nr_cod_nov, cod_nov_pred_fecha)
      ELSE null END as cod_presencialidad
    FROM (
      SELECT p.idper, p.ficha, f.fecha, f.fichadas_consolidadas,
          (f.dds BETWEEN 1 AND 5) AND (laborable is not false OR inamovible is not true AND f.dds NOT BETWEEN 1 AND 5) as trabajable,
          p.sector, f.annio, nr.detalles,
          CASE WHEN (nr.c_dds IS NOT TRUE -- FILTRO PARA DIAGRAMADO POR DIA DE SEMANA:
            OR CASE f.dds WHEN 0 THEN nr.dds0 WHEN 1 THEN nr.dds1 WHEN 2 THEN nr.dds2 WHEN 3 THEN nr.dds3 WHEN 4 THEN nr.dds4 WHEN 5 THEN nr.dds5 WHEN 6 THEN nr.dds6 END
          ) THEN nr.cod_nov ELSE null END as nr_cod_nov,
          COALESCE(CASE WHEN nr.cod_nov IS NOT NULL THEN nr.requiere_fichadas ELSE ni.requiere_fichadas END, nr.cod_nov IS NULL) as nr_requiere_fichadas,
          nr.corridos as nr_corridos,
          cod_nov_pred_fecha, 
          ni.cod_nov as cod_nov_ini,
          fv.fichadas,
          fv.cod_nov as fv_cod_nov,
          COALESCE(p.inicia_fichada, p.registra_novedades_desde) as fecha_inicio_fichada,
          COALESCE(CASE WHEN nr.cod_nov IS NOT NULL THEN nr.cuenta_horas ELSE ni.cuenta_horas END, nr.cod_nov IS NULL) as nr_cuenta_horas
        FROM fechas f INNER JOIN annios a USING (annio) CROSS JOIN personas p
          LEFT JOIN fichadas_vigentes fv USING (idper, fecha)
          LEFT JOIN LATERAL (
            SELECT nr.cod_nov, cn.corridos, nr.detalles, cn.requiere_fichadas, 
                dds0, dds1, dds2, dds3, dds4, dds5, dds6, cn.c_dds, cn.cuenta_horas
              FROM novedades_registradas nr LEFT JOIN cod_novedades cn ON nr.cod_nov = cn.cod_nov
              LEFT JOIN tipos_novedad tn USING (tipo_novedad)
              WHERE f.fecha BETWEEN nr.desde AND nr.hasta
                AND p.idper = nr.idper                
              ORDER BY tn.orden, nr.idr DESC LIMIT 1
          ) nr ON true
          LEFT JOIN LATERAL (
            SELECT nr.cod_nov, cn.corridos, nr.detalles, cn.requiere_fichadas,  
                dds0, dds1, dds2, dds3, dds4, dds5, dds6, cn.c_dds, cn.cuenta_horas
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
      OR nv.horas IS DISTINCT FROM q.horas
      OR nv.cod_presencialidad IS DISTINCT FROM q.cod_presencialidad
      ) THEN
    UPDATE SET ficha = q.ficha, cod_nov = q.cod_nov, fichadas = q.fichadas, sector = q.sector, detalles = q.detalles,
      trabajable = q.trabajable, cod_nov_ini = q.cod_nov_ini, horas = q.horas, cod_presencialidad = q.cod_presencialidad
  WHEN NOT MATCHED THEN
    INSERT   (  idper,   ficha,   fecha,   cod_nov,   fichadas,   sector,   detalles,   trabajable,   cod_nov_ini,   horas,   cod_presencialidad)
      VALUES (q.idper, q.ficha, q.fecha, q.cod_nov, q.fichadas, q.sector, q.detalles, q.trabajable, q.cod_nov_ini, q.horas, q.cod_presencialidad)
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

-- recalcula solo los años abiertos
DO
$$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT annio FROM annios WHERE abierto ORDER BY annio LOOP
    CALL actualizar_novedades_vigentes(make_date(r.annio, 1, 1), make_date(r.annio, 12, 31));
  END LOOP;
END;
$$;
