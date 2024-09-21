-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

DO
$CREATOR$
DECLARE
  v_sql text := $SQL_CON_TAG$

CREATE OR REPLACE FUNCTION novedades_calculadas/*cuil**_cuil**cuil*/(p_desde date, p_hasta date/*cuil**, p_cuil text**cuil*/) RETURNS SETOF novedades_vigentes
  LANGUAGE SQL STABLE
AS
$BODY$
  SELECT 
-- ¡ATENCIÓN! NO MODIFICAR MANUALMENTE ESTA FUNCIÓN FUE GENERADA CON EL SCRIPT novedades_calculadas.sql
-- Otras funciones que comienzan con el nombre novedades_calculadas se generaron junto a esta!
      cuil, ficha, fecha, cod_nov, ent_fich, sal_fich, sector, annio
    FROM (
      SELECT nr.cuil, p.ficha, f.fecha, nr.cod_nov, null as ent_fich, null as sal_fich, p.sector, nr.annio,
             rank() over (PARTITION BY nr.cuil, f.fecha ORDER BY nr.idr DESC) as prioridad
        FROM novedades_registradas nr 
          INNER JOIN fechas f ON f.fecha between desde and hasta
          INNER JOIN horarios h ON nr.cuil = h.cuil and f.dds = h.dds
          INNER JOIN cod_novedades cn ON cn.cod_nov = nr.cod_nov
          INNER JOIN personal p ON nr.cuil = p.cuil
        WHERE nr.desde <= f.fecha AND f.fecha <= nr.hasta
          AND p_desde <= f.fecha AND f.fecha <= p_hasta
          AND h.trabaja 
          AND f.laborable IS NOT false
          AND (cn.c_dds IS NOT TRUE -- FILTRO PARA DIAGRAMADO POR DIA DE SEMANA:
               OR CASE extract(DOW from f.fecha) WHEN 0 THEN dds0 WHEN 1 THEN dds1 WHEN 2 THEN dds2 WHEN 3 THEN dds3 WHEN 4 THEN dds4 WHEN 5 THEN dds5 WHEN 6 THEN dds6 ELSE false END
               )
          /*cuil**AND p.cuil = p_cuil**cuil*/
      ) x
    WHERE prioridad = 1
$BODY$;

$SQL_CON_TAG$;
BEGIN
  execute v_sql;
  execute replace(replace(v_sql,'/*cuil**',''),'**cuil*/','');
END;
$CREATOR$;
