/*
# Material de estudio-performance-presentismo-mensual.md

probar con:
```
psql -P pager=off -f docs\estudio-performance-presentismo-mensual.sql siper_muleto_db
```q

## Presentismo de un empleado

*/

set role to siper_muleto_admin;
set SEARCH_PATH TO "siper","public";

CALL set_app_user('regis');

BEGIN;

\timing on

SELECT count(*) as dias_mes,
        count(*) FILTER (WHERE es_laborable) as laborables,
        count(horas) as dias_promediados,
        sum(horas) as suma_horas,
        (sum(cant_horas_esperadas) FILTER (WHERE horas is not null) || ' hours')::interval as horas_esperadas,
        avg(horas) as promedio_horas,
        (avg(cant_horas_esperadas) FILTER (WHERE horas is not null) || ' hours')::interval as promedio_esperado,
        sum(horas) - (sum(cant_horas_esperadas) FILTER (WHERE horas is not null) || ' hours')::interval as saldo_horas,
        count(injustificado) as dias_injustificados,
        count(injustificado) > 0 as tiene_injustificados,
        (sum(horas) - (sum(cant_horas_esperadas) FILTER (WHERE horas is not null) || ' hours')::interval < '-7 hours'::interval) is true as bajo_umbral_horas,
        ((sum(horas) - (sum(cant_horas_esperadas) FILTER (WHERE horas is not null) || ' hours')::interval < '-7 hours'::interval) is true OR count(injustificado) > 0) is true as con_problemas,
        ((sum(horas) - (sum(cant_horas_esperadas) FILTER (WHERE horas is not null) || ' hours')::interval < '-7 hours'::interval) is true OR count(injustificado) > 0 OR sum(horas) > '0 hours'::interval OR (sum(cant_horas_esperadas) FILTER (WHERE horas is not null) || ' hours')::interval > '0 hours'::interval) is true as tiene_interes
    FROM (
select 
        p.cuil,
        p.apellido,
        p.nombres,
        p.ficha,
        p.banda_horaria,
        p.situacion_revista,
        p.activo,
        p.horario_entrada,
        p.horario_salida,
        p.es_laborable,
        p.cant_horas_esperadas,
        p.sector,
        p.sector_nombre,
        nv.*,
        cn.novedad,
        cn.requiere_fichadas,
        cn.cuenta_horas,
        cn.injustificado,
        bh.descripcion as bh_descripcion
    from (SELECT
        nv.idper,
        nv.fecha,
        nv.cod_nov,
        nv.fichadas,
        nv.annio,
        nv.trabajable,
        nv.horas
    from novedades_vigentes nv) nv 
        inner join lateral (
SELECT p.*, f.dds, f.laborable is not false and f.dds between 1 and 5 as es_laborable,
        t.categoria, t.situacion_revista, 
        t.motivo_egreso, t.jerarquia, t.cargo_atgc, t.agrupamiento, t.tramo, t.grado,
        hp.horario, nov_grupo,
        coalesce(hd.hora_desde, horario_habitual_desde) as horario_entrada, 
        coalesce(hd.hora_hasta, horario_habitual_hasta) as horario_salida,
        coalesce(hc.cant_horas, par.cant_horas_diarias) as cant_horas_esperadas,
        s.nombre_sector as sector_nombre
    FROM personas p 
        LEFT JOIN LATERAL (SELECT * 
                    FROM trayectoria_laboral tl left join situacion_revista sr using (situacion_revista)
                    WHERE propio AND tl.idper = p.idper and lapso_fechas @> nv.fecha
                    ORDER BY desde DESC, idt DESC
                    LIMIT 1) t ON TRUE

        INNER JOIN parametros par ON true
        INNER JOIN fechas f ON f.fecha = nv.fecha
        INNER JOIN annios a ON a.annio = f.annio
        LEFT JOIN horarios_per hp ON hp.idper = p.idper AND hp.lapso_fechas @> /*incluye*/ f.fecha
        LEFT JOIN horarios_cod hc ON hp.horario = hc.horario
        LEFT JOIN horarios_dds hd ON hd.horario = hc.horario AND hd.dds = f.dds
        LEFT JOIN sectores s USING (sector)
 WHERE p.idper = nv.idper) p 
            on nv.fecha between coalesce(p.registra_novedades_desde, p.fecha_ingreso) and coalesce(p.fecha_egreso, nv.fecha)
        inner join bandas_horarias bh using (banda_horaria)
        left join cod_novedades cn using (cod_nov)
) inner join parametros on true
    WHERE fecha BETWEEN '2026-06-01' AND '2026-06-01'::date + interval '1 month' - interval '1 day' AND idper = 'RA4';

\timing off

set role to siper_muleto_owner;

DROP POLICY "bp select" ON novedades_vigentes;
CREATE POLICY "bp select" ON novedades_vigentes AS RESTRICTIVE FOR select TO siper_muleto_admin
    USING ( novedades_vigentes.idper IN (SELECT idper FROM personas) );

set role to siper_muleto_admin;

CALL set_app_user('regis');

\timing on

SELECT count(*) as dias_mes,
        count(*) FILTER (WHERE es_laborable) as laborables,
        count(horas) as dias_promediados,
        sum(horas) as suma_horas,
        (sum(cant_horas_esperadas) FILTER (WHERE horas is not null) || ' hours')::interval as horas_esperadas,
        avg(horas) as promedio_horas,
        (avg(cant_horas_esperadas) FILTER (WHERE horas is not null) || ' hours')::interval as promedio_esperado,
        sum(horas) - (sum(cant_horas_esperadas) FILTER (WHERE horas is not null) || ' hours')::interval as saldo_horas,
        count(injustificado) as dias_injustificados,
        count(injustificado) > 0 as tiene_injustificados,
        (sum(horas) - (sum(cant_horas_esperadas) FILTER (WHERE horas is not null) || ' hours')::interval < '-7 hours'::interval) is true as bajo_umbral_horas,
        ((sum(horas) - (sum(cant_horas_esperadas) FILTER (WHERE horas is not null) || ' hours')::interval < '-7 hours'::interval) is true OR count(injustificado) > 0) is true as con_problemas,
        ((sum(horas) - (sum(cant_horas_esperadas) FILTER (WHERE horas is not null) || ' hours')::interval < '-7 hours'::interval) is true OR count(injustificado) > 0 OR sum(horas) > '0 hours'::interval OR (sum(cant_horas_esperadas) FILTER (WHERE horas is not null) || ' hours')::interval > '0 hours'::interval) is true as tiene_interes
    FROM (
select 
        p.cuil,
        p.apellido,
        p.nombres,
        p.ficha,
        p.banda_horaria,
        p.situacion_revista,
        p.activo,
        p.horario_entrada,
        p.horario_salida,
        p.es_laborable,
        p.cant_horas_esperadas,
        p.sector,
        p.sector_nombre,
        nv.*,
        cn.novedad,
        cn.requiere_fichadas,
        cn.cuenta_horas,
        cn.injustificado,
        bh.descripcion as bh_descripcion
    from (SELECT
        nv.idper,
        nv.fecha,
        nv.cod_nov,
        nv.fichadas,
        nv.annio,
        nv.trabajable,
        nv.horas
    from novedades_vigentes nv) nv 
        inner join lateral (
SELECT p.*, f.dds, f.laborable is not false and f.dds between 1 and 5 as es_laborable,
        t.categoria, t.situacion_revista, 
        t.motivo_egreso, t.jerarquia, t.cargo_atgc, t.agrupamiento, t.tramo, t.grado,
        hp.horario, nov_grupo,
        coalesce(hd.hora_desde, horario_habitual_desde) as horario_entrada, 
        coalesce(hd.hora_hasta, horario_habitual_hasta) as horario_salida,
        coalesce(hc.cant_horas, par.cant_horas_diarias) as cant_horas_esperadas,
        s.nombre_sector as sector_nombre
    FROM personas p 
        LEFT JOIN LATERAL (SELECT * 
                    FROM trayectoria_laboral tl left join situacion_revista sr using (situacion_revista)
                    WHERE propio AND tl.idper = p.idper and lapso_fechas @> nv.fecha
                    ORDER BY desde DESC, idt DESC
                    LIMIT 1) t ON TRUE

        INNER JOIN parametros par ON true
        INNER JOIN fechas f ON f.fecha = nv.fecha
        INNER JOIN annios a ON a.annio = f.annio
        LEFT JOIN horarios_per hp ON hp.idper = p.idper AND hp.lapso_fechas @> /*incluye*/ f.fecha
        LEFT JOIN horarios_cod hc ON hp.horario = hc.horario
        LEFT JOIN horarios_dds hd ON hd.horario = hc.horario AND hd.dds = f.dds
        LEFT JOIN sectores s USING (sector)
 WHERE p.idper = nv.idper) p 
            on nv.fecha between coalesce(p.registra_novedades_desde, p.fecha_ingreso) and coalesce(p.fecha_egreso, nv.fecha)
        inner join bandas_horarias bh using (banda_horaria)
        left join cod_novedades cn using (cod_nov)
) inner join parametros on true
    WHERE fecha BETWEEN '2026-06-01' AND '2026-06-01'::date + interval '1 month' - interval '1 day' AND idper = 'RA4';

\timing off

ROLLBACK;

