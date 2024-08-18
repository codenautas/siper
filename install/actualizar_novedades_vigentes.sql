-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION calcular_novedades_vigentes(p_desde date, p_hasta date, p_cuil text) RETURNS void
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
UPDATE novedades_vigentes nv 
  SET ficha = q.ficha, cod_nov = q.cod_nov, ent_fich = q.ent_fich, sal_fich = q.sal_fich, sector = q.sector --, annio = q.annio
  FROM (SELECT cn.*
         FROM novedades_calculadas(p_desde, p_hasta, p_cuil) cn
         JOIN novedades_vigentes nv ON cn.cuil = nv.cuil and cn.fecha = nv.fecha) q 
  WHERE nv.cuil = q.cuil and nv.fecha = q.fecha and 
      (nv.cod_nov IS DISTINCT FROM q.cod_nov
	   OR nv.ficha IS DISTINCT FROM q.ficha 
       OR nv.cod_nov IS DISTINCT FROM q.cod_nov 
       OR nv.ent_fich IS DISTINCT FROM q.ent_fich 
       OR nv.sal_fich IS DISTINCT FROM q.sal_fich 
       OR nv.sector IS DISTINCT FROM q.sector);

INSERT INTO novedades_vigentes (cuil, ficha, fecha, cod_nov, ent_fich, sal_fich, sector)
   SELECT cn.cuil, cn.ficha, cn.fecha, cn.cod_nov, cn.ent_fich, cn.sal_fich, cn.sector
     FROM novedades_calculadas(p_desde, p_hasta, p_cuil) cn
     LEFT JOIN novedades_vigentes nv ON cn.cuil = nv.cuil and cn.fecha = nv.fecha
     WHERE nv.cuil is null and nv.fecha is null;
END;
$BODY$;
