-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

DO 
$CREATOR$
DECLARE
  v_sql text := $SQL_CON_TAG$

CREATE OR REPLACE FUNCTION calcular_novedades_vigentes/*cuil**_cuil**cuil*/(p_desde date, p_hasta date/*cuil**, p_cuil text**cuil*/) RETURNS void
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
-- ¡ATENCIÓN! NO MODIFICAR MANUALMENTE ESTA FUNCIÓN FUE GENERADA CON EL SCRIPT actualizar_novedades_vigentes.sql
-- Otras funciones que comienzan con el nombre actualizar_novedades_vigentes se generaron junto a esta!
MERGE INTO novedades_vigentes nv 
  USING novedades_calculadas/*cuil**_cuil**cuil*/(p_desde, p_hasta/*cuil**, p_cuil**cuil*/) q
    ON nv.cuil = q.cuil AND nv.fecha = q.fecha
  WHEN MATCHED AND 
      (nv.cod_nov IS DISTINCT FROM q.cod_nov
      OR nv.ficha IS DISTINCT FROM q.ficha 
      OR nv.cod_nov IS DISTINCT FROM q.cod_nov 
      OR nv.ent_fich IS DISTINCT FROM q.ent_fich 
      OR nv.sal_fich IS DISTINCT FROM q.sal_fich 
      OR nv.sector IS DISTINCT FROM q.sector) THEN
    UPDATE SET ficha = q.ficha, cod_nov = q.cod_nov, ent_fich = q.ent_fich, sal_fich = q.sal_fich, sector = q.sector
  WHEN NOT MATCHED THEN
    INSERT (cuil, ficha, fecha, cod_nov, ent_fich, sal_fich, sector)
      VALUES (q.cuil, q.ficha, q.fecha, q.cod_nov, q.ent_fich, q.sal_fich, q.sector);
--WHEN NOT MATCHED BY SOURCE THEN DELETE --Postgresql 17
--agrego delete provisorio hasta que se instale el postgres 17
DELETE FROM novedades_vigentes nv
  USING
  (SELECT v.cuil, v.fecha
    FROM novedades_vigentes v
    LEFT JOIN novedades_calculadas/*cuil**_cuil**cuil*/(p_desde, p_hasta/*cuil**, p_cuil**cuil*/) c ON v.cuil = c.cuil AND v.fecha = c.fecha
    WHERE /*cuil**v.cuil = p_cuil
      AND **cuil*/v.fecha BETWEEN p_desde AND p_hasta 
      AND c.cuil IS NULL
  ) d
  WHERE nv.cuil = d.cuil AND nv.fecha = d.fecha;
--FIN agrego delete provisorio hasta que se instale el postgres 17
END;
$BODY$;

$SQL_CON_TAG$;
BEGIN
  execute v_sql;
  execute replace(replace(v_sql,'/*cuil**',''),'**cuil*/','');
END;
$CREATOR$;
