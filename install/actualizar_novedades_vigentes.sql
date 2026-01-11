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
