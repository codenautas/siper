-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

/* LA TABLA ANNIO NO ES EDITABLE, SOLO SE PUEDE ACTUALIZAR DESDE SUS PROCEDIMIENTOS */

/* PREPARA UN AÑO ANTES DE HABILITARLO */

CREATE OR REPLACE FUNCTION annio_preparar(p_annio integer) RETURNS VOID
  LANGUAGE PLPGSQL VOLATILE SECURITY DEFINER
AS
$BODY$
BEGIN
  INSERT INTO annios (annio, abierto) VALUES (p_annio, false);
  INSERT INTO fechas (fecha) 
    SELECT d FROM generate_series(make_date(p_annio,1,1), make_date(p_annio,12,31), '1 day'::INTERVAL) d;
END;
$BODY$;

