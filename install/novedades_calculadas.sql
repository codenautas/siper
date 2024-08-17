-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION novedades_calculadas(p_desde date, p_hasta date, p_cuil text) RETURNS SETOF novedades_vigentes
  LANGUAGE SQL STABLE
AS
$BODY$
  SELECT nr.cuil, p.ficha, f.fecha, nr.cod_nov, null as ent_fich, null as sal_fich, p.sector, nr.annio
    FROM novedades_registradas nr 
      INNER JOIN fechas f ON f.fecha between desde and hasta
      INNER JOIN personal p ON nr.cuil = p.cuil
    WHERE nr.desde >= p_desde AND nr.hasta <= p_hasta
      AND extract(DOW from f.fecha) BETWEEN 1 AND 5
      AND f.laborable IS NOT false
      AND p.cuil = p_cuil;
$BODY$;
