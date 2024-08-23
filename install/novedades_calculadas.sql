-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION novedades_calculadas(p_desde date, p_hasta date, p_cuil text) RETURNS SETOF novedades_vigentes
  LANGUAGE SQL STABLE
AS
$BODY$
  SELECT cuil, ficha, fecha, cod_nov, ent_fich, sal_fich, sector, annio
    FROM (
      SELECT nr.cuil, p.ficha, f.fecha, nr.cod_nov, null as ent_fich, null as sal_fich, p.sector, nr.annio,
             rank() over (PARTITION BY nr.cuil, f.fecha ORDER BY nr.idr DESC) as prioridad
        FROM novedades_registradas nr 
          INNER JOIN fechas f ON f.fecha between desde and hasta
          INNER JOIN cod_novedades cn ON cn.cod_nov = nr.cod_nov
          INNER JOIN personal p ON nr.cuil = p.cuil
        WHERE nr.desde >= p_desde AND nr.hasta <= p_hasta
          AND extract(DOW from f.fecha) BETWEEN 1 AND 5
          AND f.laborable IS NOT false
          AND (cn.c_dds IS NOT TRUE -- FILTRO PARA DIAGRAMADO POR DIA DE SEMANA:
               OR CASE extract(DOW from f.fecha) WHEN 1 THEN dds1 WHEN 2 THEN dds2 WHEN 3 THEN dds3 WHEN 4 THEN dds4 WHEN 5 THEN dds5 ELSE false END
               )
          AND CASE WHEN p_cuil IS NULL THEN TRUE ELSE p.cuil = p_cuil END
      ) x
    WHERE prioridad = 1
$BODY$;


