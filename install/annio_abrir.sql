-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION annio_abrir(p_annio integer) RETURNS VOID
  LANGUAGE PLPGSQL VOLATILE SECURITY DEFINER
AS
$BODY$
BEGIN
  UPDATE annios 
    SET abierto = true
    WHERE annio = p_annio;
  CALL actualizar_novedades_vigentes(make_date(p_annio,1,1), make_date(p_annio,12,31));
END;
$BODY$;

