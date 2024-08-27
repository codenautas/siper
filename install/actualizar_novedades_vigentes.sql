-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION calcular_novedades_vigentes(p_desde date, p_hasta date, p_cuil text DEFAULT NULL) RETURNS void
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
MERGE INTO novedades_vigentes nv 
  USING novedades_calculadas(p_desde, p_hasta, p_cuil) q
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
    LEFT JOIN novedades_calculadas(p_desde, p_hasta, p_cuil) c ON v.cuil = c.cuil AND v.fecha = c.fecha
    WHERE CASE WHEN p_cuil IS NULL THEN TRUE ELSE v.cuil = p_cuil END
          AND v.fecha BETWEEN p_desde AND p_hasta AND c.cuil IS NULL
  ) d
  WHERE nv.cuil = d.cuil AND nv.fecha = d.fecha;
--FIN agrego delete provisorio hasta que se instale el postgres 17
END;
$BODY$;
