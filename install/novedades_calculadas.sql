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
-- ¡ATENCIÓN! NO MODIFICAR MANUALMENTE ESTA FUNCIÓN FUE GENERADA CON EL SCRIPT novedades_calculadas.sql
-- Otras funciones que comienzan con el nombre novedades_calculadas se generaron junto a esta!
      idper, fecha, 
      COALESCE(
        CASE WHEN trabajable OR nr_corridos THEN nr_cod_nov ELSE null END, -- si la última novedad registrada no es una anulación
        CASE WHEN not trabajable THEN null WHEN tiene_horario_declarado THEN h_cod_nov ELSE cod_nov_habitual END
      ) as cod_nov, 
      ficha, null as ent_fich, null as sal_fich, sector, annio,
      con_novedad AND CASE WHEN trabajable OR nr_corridos THEN true ELSE false END as con_novedad, trabajable, detalles
    FROM (
      SELECT p.idper, p.ficha, f.fecha, 
          h.idper IS NOT NULL as tiene_horario_declarado,
          CASE WHEN h.idper IS NOT NULL THEN h.trabaja ELSE f.dds BETWEEN 1 AND 5 END AND (laborable is not false OR inamovible is not true AND f.dds NOT BETWEEN 1 AND 5) as trabajable,
          p.sector, f.annio, nr.detalles,
          nr.cod_nov as nr_cod_nov,
          nr.corridos as nr_corridos,
          h.cod_nov as h_cod_nov,
          cod_nov_habitual,
          nr.con_novedad
        FROM fechas f INNER JOIN annios a USING (annio) CROSS JOIN personas p
          LEFT JOIN LATERAL (
            SELECT *
              FROM horarios h 
              WHERE p.idper = h.idper AND f.fecha BETWEEN h.desde AND h.hasta AND f.dds = h.dds AND f.annio = h.annio
          ) h ON true
          LEFT JOIN LATERAL (
            SELECT nr.cod_nov, cn.corridos, nr.detalles, cn.con_novedad 
              FROM novedades_registradas nr LEFT JOIN cod_novedades cn ON nr.cod_nov = cn.cod_nov
              WHERE f.fecha BETWEEN nr.desde AND nr.hasta
                AND p.idper = nr.idper
              ORDER BY nr.idr DESC LIMIT 1
          ) nr ON true
        WHERE f.fecha BETWEEN p_desde AND p_hasta
          /*idper**AND p.idper = p_idper**idper*/
      ) x
$BODY$;

$SQL_CON_TAG$;
BEGIN
  execute v_sql;
  execute replace(replace(v_sql,'/*idper**',''),'**idper*/','');
END;
$CREATOR$;

/*
select * from novedades_registradas;
select * from personas;
select * from HORARIOS;
SELECT * FROM FECHAS ORDER BY FECHA ASC;
insert into fechas (fecha) select date_trunc('day', d) from generate_series(cast('2000-01-01' as timestamp), cast('2000-12-31' as timestamp), cast('1 day' as interval)) d
insert into novedades_registradas (idper, cod_nov, desde, hasta)  values ('AR8', '121', '2000-01-01', '2000-01-04');
select * from novedades_calculadas_idper('2000-01-01'::date, '2000-01-11'::date, 'AR8'::text);
select * from novedades_vigentes WHERE idper = 'AR8';
*/