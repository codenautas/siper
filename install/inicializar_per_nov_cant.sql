-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE PROCEDURE inicializar_per_nov_cant(p_annio integer, p_idper text DEFAULT NULL)
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  INSERT INTO per_nov_cant (annio, cod_nov, idper, origen, cantidad)
    SELECT p_annio,
        c.cod_nov,
        p.idper,
        CASE c.inicializacion WHEN 'LICORD' THEN 'TRAS' ELSE p_annio::text END as origen,
        CASE c.inicializacion WHEN 'CONST' THEN c.inicializacion_limite ELSE 0 END as cantidad
      FROM cod_novedades c,
        personas p
      WHERE p.activo 
        AND EXISTS (
          SELECT 1 
            FROM trayectoria_laboral INNER JOIN situacion_revista USING (situacion_revista) 
            WHERE ini_per_nov_cant 
              AND p_annio BETWEEN extract(YEAR from desde) AND extract(YEAR from coalesce(hasta,'9999-12-31'))
        )
        AND c.inicializacion = 'CONST'
        AND (p_idper IS NULL OR p.idper = p_idper);
END;
$BODY$;

