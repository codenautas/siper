-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

-- call set_app_user('perry');

-- drop type detalle_novedades_multiorigen cascade;

-- /*
CREATE TYPE detalle_novedades_multiorigen as (
  origen text,
  cantidad integer,
  usados integer,
  pendientes integer,
  saldo integer,
  comienzo date,
  vencimiento date
);

-- */

CREATE OR REPLACE FUNCTION detalle_nov_multiorigen(p_fechas date[], p_esquema text) RETURNS text 
  LANGUAGE PLPGSQL IMMUTABLE
AS
$BODY$
DECLARE
  v_esquema record;
  v_renglon detalle_novedades_multiorigen;
  v_detalles detalle_novedades_multiorigen[] := array[]::detalle_novedades_multiorigen[];
  -- Locales al loop:
  v_resto integer;
  i integer := 1;
  v_inconsistencias integer := 0;
  v_mensajes text[] := array[]::text[];
  v_result jsonb := '{}'::jsonb;
BEGIN
  IF p_esquema IS null THEN
    RETURN null;
  ELSE
    FOR v_esquema IN 
      SELECT key AS origen, (value->>'cantidad')::integer AS cantidad, (value->>'comienzo')::date AS comienzo, (value->>'vencimiento')::date AS vencimiento
        FROM jsonb_each(p_esquema::jsonb)
        ORDER BY key
    LOOP
      RAISE NOTICE 'ESTOY %', v_esquema;
      v_renglon.cantidad := v_esquema.cantidad;
      v_renglon.saldo := v_esquema.cantidad;
      v_renglon.origen := v_esquema.origen;
      v_renglon.usados := null;
      v_renglon.pendientes := null;
      WHILE CASE WHEN i > ARRAY_LENGTH(p_fechas, 1) THEN FALSE 
        ELSE v_renglon.saldo > 0 AND (v_esquema.vencimiento IS NULL OR p_fechas[i] <= v_esquema.vencimiento) END 
      LOOP
        RAISE NOTICE 'TENGO % % % i:% %', v_renglon.saldo, i, p_fechas[i], p_fechas[i] < v_esquema.comienzo, p_fechas[i] <= v_esquema.vencimiento;
        IF p_fechas[i] < v_esquema.comienzo THEN
          v_inconsistencias := v_inconsistencias + 1;
        ELSE
          v_renglon.saldo := (v_renglon.saldo - 1);
          IF p_fechas[i] <= fecha_actual() THEN
            v_renglon.usados := COALESCE(v_renglon.usados, 0) + 1;
          ELSE
            v_renglon.pendientes := COALESCE(v_renglon.pendientes, 0) + 1;
          END IF;
        END IF;
        i := i + 1;
      END LOOP;
      v_detalles := v_detalles || v_renglon;
      RAISE NOTICE 'END LOOP % %', v_detalles, v_inconsistencias;
    END LOOP;
    if v_inconsistencias > 0 then 
      v_mensajes := array_append(v_mensajes, 'inconsistencia ' || v_inconsistencias || ' fecha(s) en brecha agotada');
    end if; 
    RAISE NOTICE 'MENSAJES % %', v_mensajes, v_inconsistencias;
    v_inconsistencias := ARRAY_LENGTH(p_fechas, 1) - i + 1;
    if v_inconsistencias > 0 then 
      v_mensajes := array_append(v_mensajes, 'inconsistencia ' || v_inconsistencias || ' fecha(s) pasado el limite');
    end if;
    RAISE NOTICE 'MENSAJES % %', v_mensajes, v_inconsistencias;
    v_result := jsonb_build_object('detalle', to_jsonb(v_detalles));
    if array_length(v_mensajes, 1) >0 then
      v_result := v_result || jsonb_build_object('error', to_jsonb(v_mensajes));
    end if; --1
    RETURN v_result::text;
  END IF;
END;
$BODY$;

/* CASOS DE PRUEBA
select esperado = detalle_nov_multiorigen(d.fechas, d.esquema) as ok, detalle_nov_multiorigen(d.fechas, d.esquema), esperado
  FROM (
      VALUES (
          array['2021-01-03'::date, '2021-01-04'::date], 
          '{"2021":{"cantidad": 20}, "2022":{"cantidad": 30}}', 
          '{"detalle": [{"saldo": 18, "origen": "2021", "usados": null, "cantidad": 20, "comienzo": null, "pendientes": 2, "vencimiento": null}, {"saldo": 30, "origen": "2022", "usados": null, "cantidad": 30, "comienzo": null, "pendientes": null, "vencimiento": null}]}'
         ), (
          array['2021-01-03'::date, '2021-02-02'::date, '2021-02-02'::date], 
          '{"2021":{"cantidad": 20, "comienzo": "2021-01-01","vencimiento":"2021-01-31"}, "2022":{"cantidad": 30, "comienzo": "2021-02-01","vencimiento":"2021-02-28"}}', 
          '{"detalle": [{"saldo": 19, "origen": "2021", "usados": null, "cantidad": 20, "comienzo": null, "pendientes": 1, "vencimiento": null}, {"saldo": 28, "origen": "2022", "usados": null, "cantidad": 30, "comienzo": null, "pendientes": 2, "vencimiento": null}]}'
         ), (
          array['2021-01-03'::date, '2021-02-02'::date, '2021-03-02'::date, '2021-04-02'::date], 
          '{"2021":{"cantidad": 20, "comienzo": "2021-01-01","vencimiento":"2021-01-31"}, "2022":{"cantidad": 30, "comienzo": "2021-03-01","vencimiento":"2021-03-31"}}', 
          '{"error": ["inconsistencia 1 fecha(s) en brecha agotada", "inconsistencia 1 fecha(s) pasado el limite"], "detalle": [{"saldo": 19, "origen": "2021", "usados": null, "cantidad": 20, "comienzo": null, "pendientes": 1, "vencimiento": null}, {"saldo": 29, "origen": "2022", "usados": null, "cantidad": 30, "comienzo": null, "pendientes": 1, "vencimiento": null}]}'
         ), (
          array['2021-01-03'::date, '2021-03-01'::date, '2021-03-02'::date, '2021-03-03'::date], 
          '{"2021":{"cantidad": 2, "vencimiento":"2021-01-31"}, "2022":{"cantidad": 2}}', 
          '{"error": ["inconsistencia 1 fecha(s) pasado el limite"], "detalle": [{"saldo": 1, "origen": "2021", "usados": null, "cantidad": 2, "comienzo": null, "pendientes": 1, "vencimiento": null}, {"saldo": 0, "origen": "2022", "usados": null, "cantidad": 2, "comienzo": null, "pendientes": 2, "vencimiento": null}]}'
         )
    ) as d (fechas, esquema, esperado);
-- */

