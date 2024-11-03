-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

DO 
$CREATOR$
DECLARE
  v_sql text := $SQL_CON_TAG$

CREATE OR REPLACE FUNCTION calcular_novedades_vigentes/*idper**_idper**idper*/(p_desde date, p_hasta date/*idper**, p_idper text**idper*/) RETURNS void
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
-- ¡ATENCIÓN! NO MODIFICAR MANUALMENTE ESTA FUNCIÓN FUE GENERADA CON EL SCRIPT actualizar_novedades_vigentes.sql
-- Otras funciones que comienzan con el nombre actualizar_novedades_vigentes se generaron junto a esta!
MERGE INTO novedades_vigentes nv 
  USING novedades_calculadas/*idper**_idper**idper*/(p_desde, p_hasta/*idper**, p_idper**idper*/) q
    ON nv.idper = q.idper AND nv.fecha = q.fecha
  WHEN MATCHED AND 
      (nv.ficha IS DISTINCT FROM q.ficha 
      OR nv.cod_nov IS DISTINCT FROM q.cod_nov 
      OR nv.ent_fich IS DISTINCT FROM q.ent_fich 
      OR nv.sal_fich IS DISTINCT FROM q.sal_fich 
      OR nv.sector IS DISTINCT FROM q.sector
      OR nv.detalles IS DISTINCT FROM q.detalles
      OR nv.con_novedad IS DISTINCT FROM q.con_novedad
      OR nv.trabajable IS DISTINCT FROM q.trabajable) THEN
    UPDATE SET ficha = q.ficha, cod_nov = q.cod_nov, ent_fich = q.ent_fich, sal_fich = q.sal_fich, sector = q.sector, detalles = q.detalles,
      con_novedad = q.con_novedad, trabajable = q.trabajable
  WHEN NOT MATCHED THEN
    INSERT (idper, ficha, fecha, cod_nov, ent_fich, sal_fich, sector, detalles, con_novedad, trabajable)
      VALUES (q.idper, q.ficha, q.fecha, q.cod_nov, q.ent_fich, q.sal_fich, q.sector, q.detalles, q.con_novedad, q.trabajable)
  WHEN NOT MATCHED BY SOURCE AND nv.fecha BETWEEN p_desde AND p_hasta/*idper** AND nv.idper = p_idper**idper*/ THEN DELETE;
END;
$BODY$;

$SQL_CON_TAG$;
BEGIN
  execute v_sql;
  execute replace(replace(v_sql,'/*idper**',''),'**idper*/','');
END;
$CREATOR$;
