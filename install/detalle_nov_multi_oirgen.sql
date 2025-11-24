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

SELECT annio, origen, x.idper, apellido, nombres,
                	x.sector,
                    abierto_cantidad as cantidad,
                    abierto_usados as usados,
                    abierto_pendientes as pendientes,
                    abierto_saldo as saldo,
                    cantidad as suma_cantidad,
                    usados as suma_usados,
                    pendientes as suma_pendientes,
                    saldo as suma_saldo,
                    novedad
                    FROM (

    select a.annio, 
            origen, 
            abierto.cantidad as abierto_cantidad,
            abierto.usados as abierto_usados,
            abierto.pendientes as abierto_pendientes,
            abierto.saldo as abierto_saldo,
            cn.cod_nov, 
            p.idper, 
            p.sector,
            pnc.cantidad,
            nv.usados,
            nv.pendientes,
            nv.saldo,
            pnc.esquema,
            (pnc.cantidad > 0 or nv.usados > 0 or nv.pendientes > 0) as con_dato,
            cn.comun,
            cn.novedad,
            cn.c_dds,
            cn.con_detalles,
            cn.registra,
            cn.prioritario,
            nv.saldo < 0 as error_saldo_negativo,
            fch.error_falta_entrada
    from cod_novedades cn
    left join lateral (
        select p.idper, cd.cod_nov, true as error_falta_entrada from novedades_vigentes nv
        left join personas p on nv.idper = p.idper
        left join fichadas f on  f.idper = p.idper and f.fecha = nv.fecha
        left join cod_novedades cd on nv.cod_nov = cd.cod_nov
        where cd.requiere_entrada and f.hora is null
        group by p.idper, cd.cod_nov
    ) fch on cn.cod_nov = fch.cod_nov,
        parametros par,
        annios a,
        personas p,
        lateral (
            select sum(cantidad) as cantidad,
                    json_object_agg(origen, json_build_object('cantidad', cantidad) order by origen)::text as esquema                    
                from per_nov_cant pnc
                where pnc.cod_nov = cn.cod_nov and pnc.annio = a.annio and pnc.idper = p.idper
        ) pnc,
        lateral (
            select 
                    count(*) filter (where nv.fecha <= fecha_actual()) as usados, 
                    count(*) filter (where nv.fecha > fecha_actual()) as pendientes, 
                    pnc.cantidad - count(*) as saldo
                from novedades_vigentes nv
                where nv.cod_nov = cn.cod_nov and nv.annio = a.annio and nv.idper = p.idper
        ) nv
        , lateral (select * from jsonb_populate_recordset(
            null::detalle_novedades_multiorigen, 
            detalle_nov_multiorigen(
                nv.usados, nv.pendientes, 
                (select jsonb_object_agg(origen, jsonb_build_object('cantidad', cantidad) order by origen) from per_nov_cant pnc where pnc.cod_nov = cn.cod_nov and pnc.annio = a.annio and pnc.idper = p.idper)::text
            )::jsonb
        )) abierto
        where true 
            --and a.annio = 2025

                    ) x
                        LEFT JOIN personas p ON p.idper = x.idper  
                    WHERE cod_nov = '1'
                    ORDER BY 1,3,2,4;