SET search_path = siper;
SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION calculo_novedades_calcular(pdesde date, phasta date) RETURNS SETOF novedades_vigentes
AS
$$
  SELECT nr.cuil, p.ficha, f.fecha, nr.cod_nov, null as ent_fich, null as sal_fich, p.sector, nr.annio
    FROM siper.novedades_registradas nr 
    LEFT JOIN siper.fechas f ON f.fecha between desde and hasta
    LEFT JOIN siper.personal p ON nr.cuil = p.cuil
    --LEFT JOIN siper.fichadas fi ON 
    WHERE nr.desde >= pdesde AND nr.hasta <= phasta;
$$
LANGUAGE SQL;

--SELECT * FROM calculo_novedades_calcular('01-01-2024', '31-01-2024');

CREATE OR REPLACE FUNCTION calculo_novedades_registrar(pdesde date, phasta date) RETURNS void
AS
$$
UPDATE siper.novedades_vigentes nv 
  SET ficha = q.ficha, cod_nov = q.cod_nov, ent_fich = q.ent_fich, sal_fich = q.sal_fich, sector = q.sector --, annio = q.annio
  FROM (SELECT cn.*
         FROM siper.calculo_novedades_calcular(pdesde, phasta) cn
         JOIN siper.novedades_vigentes nv ON cn.cuil = nv.cuil and cn.fecha = nv.fecha and cn.cod_nov = nv.cod_nov) q 
  WHERE nv.cuil = q.cuil and nv.fecha = q.fecha and nv.cod_nov = q.cod_nov and
      (nv.ficha IS DISTINCT FROM q.ficha 
       OR nv.cod_nov IS DISTINCT FROM q.cod_nov 
       OR nv.ent_fich IS DISTINCT FROM q.ent_fich 
       OR nv.sal_fich IS DISTINCT FROM q.sal_fich 
       OR nv.sector IS DISTINCT FROM q.sector 
       /*OR nv.annio IS DISTINCT FROM q.annio*/);

INSERT INTO siper.novedades_vigentes (cuil, ficha, fecha, cod_nov, ent_fich, sal_fich, sector)
   SELECT cn.cuil, cn.ficha, cn.fecha, cn.cod_nov, cn.ent_fich, cn.sal_fich, cn.sector
     FROM siper.calculo_novedades_calcular(pdesde, phasta) cn
     LEFT JOIN siper.novedades_vigentes nv ON cn.cuil = nv.cuil and cn.fecha = nv.fecha and cn.cod_nov = nv.cod_nov 
     WHERE nv.cuil is null and nv.fecha is null and nv.cod_nov is null;
$$
LANGUAGE SQL;
