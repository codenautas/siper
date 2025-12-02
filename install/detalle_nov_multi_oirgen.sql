-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

call set_app_user('perry');

/*
CREATE TYPE detalle_novedades_multiorigen as (
  origen text,
  cantidad integer,
  usados integer,
  pendientes integer,
  saldo integer
);
-- */

CREATE OR REPLACE FUNCTION detalle_nov_multiorigen(p_usados bigint, p_pendientes bigint, p_esquema text) RETURNS text 
  LANGUAGE PLPGSQL IMMUTABLE
AS
$BODY$
DECLARE
  v_esquema record;
  v_usados integer;
  v_pendientes integer;
  v_renglon detalle_novedades_multiorigen;
  v_result detalle_novedades_multiorigen[] := array[]::detalle_novedades_multiorigen[];
  -- Locales al loop:
  v_resto integer;
BEGIN
  IF p_esquema IS null THEN
    RETURN null;
  ELSE
    v_usados := coalesce(p_usados, 0);
    v_pendientes := coalesce(p_pendientes, 0);
    FOR v_esquema IN 
      SELECT key AS origen, (value->>'cantidad')::integer AS cantidad
        FROM jsonb_each(p_esquema::jsonb)
        ORDER BY key
    LOOP
      v_renglon.cantidad := v_esquema.cantidad;
      v_renglon.origen := v_esquema.origen;
      v_renglon.usados := case when v_usados > v_renglon.cantidad then v_renglon.cantidad else v_usados end;
      v_usados := v_usados - v_renglon.usados;
      v_resto := v_renglon.cantidad - v_renglon.usados;
      v_renglon.pendientes := case when v_pendientes > v_resto then v_resto else v_pendientes end;
      v_pendientes := v_pendientes - v_renglon.pendientes;
      v_renglon.saldo := v_renglon.cantidad - (v_renglon.usados + v_renglon.pendientes);
      v_result := v_result || v_renglon;
    END LOOP;
    IF v_usados > 0 OR v_pendientes > 0 THEN
      v_renglon.origen := 'inconsistencia';
      v_renglon.cantidad := null;
      v_renglon.usados := v_usados;
      v_renglon.penientes := v_pendientes;
      v_renglon.saldo := - v_usados - v_pendientes;
      v_result := v_result || v_renglon;
    END IF;
    RETURN to_jsonb(v_result)::text;
  END IF;
END;
$BODY$;

/*
select detalle_nov_multiorigen(30,17,'{"2021":{"cantidad": 20}, "2022":{"cantidad": 30}}');
*/

