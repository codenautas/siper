# Estudio de performance al pedir el persentimo de un mes

## Problema

Un usuario del backend con permisos de admin trae los datos de todos los empleados en un segundo. 
Un usuario del backend con permisos de registra trae los datos solo de los empleados de su sector en un minuto.

La diferencia entre ambos es la política de seguridad por filas que filtra por idper. 

## Análisis previo

El sql ejecutado en ambos casos es:

```sql
-----------------------
-- QUERY
BEGIN TRANSACTION;
-- QUERY
SELECT "presentismo"."idper", "presentismo"."sector", "presentismo"."dias_promediados", "presentismo"."suma_horas", "presentismo"."horas_esperadas", "presentismo"."promedio_horas", "presentismo"."promedio_esperado", "presentismo"."saldo_horas", "presentismo"."dias_injustificados", "presentismo"."tiene_injustificados", "presentismo"."bajo_umbral_horas", "presentismo"."con_problemas", "presentismo"."tiene_interes", "personas"."apellido" as "personas__apellido", "personas"."nombres" as "personas__nombres", "sectores"."nombre_sector" as "sectores__nombre_sector"
 FROM (SELECT idper, sector, count(*) as dias_mes,
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
    WHERE fecha BETWEEN '2026-06-01' AND '2026-06-01'::date + interval '1 month' - interval '1 day' GROUP BY idper, sector) as "presentismo"
    left join (
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
                    WHERE propio AND tl.idper = p.idper and lapso_fechas @> fecha_actual()
                    ORDER BY desde DESC, idt DESC
                    LIMIT 1) t ON TRUE

        INNER JOIN parametros par ON true
        INNER JOIN fechas f ON f.fecha = fecha_actual()
        INNER JOIN annios a ON a.annio = f.annio
        LEFT JOIN horarios_per hp ON hp.idper = p.idper AND hp.lapso_fechas @> /*incluye*/ f.fecha
        LEFT JOIN horarios_cod hc ON hp.horario = hc.horario
        LEFT JOIN horarios_dds hd ON hd.horario = hc.horario AND hd.dds = f.dds
        LEFT JOIN sectores s USING (sector)
) as "personas" on "presentismo"."idper" = "personas"."idper"
    left join "sectores" as "sectores" on "presentismo"."sector" = "sectores"."sector"
 WHERE true
 ORDER BY "idper";
-- ------
-----------------------
-- QUERY
COMMIT;
-- ------
-----------------------
```

Pero se agrega un prefijo para setear el usuario del backend, porque la seguridad por filas se determina de ahí. `perry` es un usuario administrador:

```sql
CALL set_app_user('perry');
-- QUERY
set SEARCH_PATH TO "siper","public";
-- ------
-----------------------
-- QUERY
set datestyle TO iso,dmy;
```

En ambos casos el usuario de base de datos es siper_muleto_admin que es el usuario al que se le aplican las políticas de seguridad por fila. 

Si pido un explain plan de esa query en ambos casos me devuelve esto (o sea no figuran las políticas acá).
```
'Nested Loop Left Join  (cost=1209980.68..1217625.68 rows=144 width=171)'
'  InitPlan 1'
'    ->  Seq Scan on roles  (cost=0.00..1.07 rows=1 width=1)'
'          Filter: (rol = current_setting(''backend_plus._rol''::text))'
'  InitPlan 3'
'    ->  Seq Scan on roles roles_2  (cost=0.00..1.07 rows=1 width=1)'
'          Filter: (rol = current_setting(''backend_plus._rol''::text))'
'  ->  Nested Loop Left Join  (cost=1209978.39..1217584.62 rows=144 width=129)'
'        ->  GroupAggregate  (cost=1209937.81..1209960.13 rows=144 width=125)'
'              Group Key: nv.idper, p_1.sector'
'              InitPlan 5'
'                ->  Seq Scan on roles roles_3  (cost=0.00..1.07 rows=1 width=1)'
'                      Filter: (rol = current_setting(''backend_plus._rol''::text))'
'              InitPlan 7'
'                ->  Seq Scan on roles roles_5  (cost=0.00..1.07 rows=1 width=1)'
'                      Filter: (rol = current_setting(''backend_plus._rol''::text))'
'              ->  Sort  (cost=1209935.66..1209936.02 rows=144 width=30)'
'                    Sort Key: nv.idper, p_1.sector'
'                    ->  Nested Loop Left Join  (cost=42.41..1209930.50 rows=144 width=30)'
'                          ->  Nested Loop  (cost=42.26..1209921.10 rows=144 width=32)'
'                                Join Filter: (bh.banda_horaria = p_1.banda_horaria)'
'                                ->  Nested Loop  (cost=42.26..1209914.73 rows=144 width=39)'
'                                      ->  Index Scan using "fecha 4 novedades_vigentes IDX" on novedades_vigentes nv  (cost=0.42..1118692.35 rows=1293 width=27)'
'                                            Index Cond: (fecha >= ''2026-06-01''::date)'
'                                            Filter: (((InitPlan 5).col1 OR (SubPlan 6) OR ((InitPlan 7).col1 AND (SubPlan 13))) AND (fecha <= ''2026-06-30 00:00:00''::timestamp without time zone))'
'                                            SubPlan 6'
'                                              ->  Result  (cost=0.01..1.08 rows=1 width=1)'
'                                                    One-Time Filter: (nv.idper = current_setting(''backend_plus._idper''::text))'
'                                                    ->  Seq Scan on roles roles_4  (cost=0.01..1.08 rows=1 width=1)'
'                                                          Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                            SubPlan 13'
'                                              ->  Result  (cost=11.79..12.05 rows=1 width=1)'
'                                                    InitPlan 12'
'                                                      ->  Index Scan using personas_pkey on personas  (cost=2.42..11.79 rows=1 width=5)'
'                                                            Index Cond: (idper = nv.idper)'
'                                                            Filter: CASE WHEN (current_setting(''backend_plus._mode''::text) = ''login''::text) THEN true ELSE ((InitPlan 8).col1 OR (SubPlan 9) OR ((InitPlan 10).col1 AND (SubPlan 11))) END'
'                                                            InitPlan 8'
'                                                              ->  Seq Scan on roles roles_6  (cost=0.00..1.07 rows=1 width=1)'
'                                                                    Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                            InitPlan 10'
'                                                              ->  Seq Scan on roles roles_8  (cost=0.00..1.07 rows=1 width=1)'
'                                                                    Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                            SubPlan 9'
'                                                              ->  Result  (cost=0.01..1.08 rows=1 width=1)'
'                                                                    One-Time Filter: (personas.idper = current_setting(''backend_plus._idper''::text))'
'                                                                    ->  Seq Scan on roles roles_7  (cost=0.01..1.08 rows=1 width=1)'
'                                                                          Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                            SubPlan 11'
'                                                              ->  Result  (cost=0.00..0.26 rows=1 width=1)'
'                                      ->  Subquery Scan on p_1  (cost=41.83..70.54 rows=1 width=28)'
'                                            Filter: ((nv.fecha >= COALESCE(p_1.registra_novedades_desde, p_1.fecha_ingreso)) AND (nv.fecha <= COALESCE(p_1.fecha_egreso, nv.fecha)))'
'                                            ->  Nested Loop  (cost=41.83..70.53 rows=1 width=771)'
'                                                  InitPlan 14'
'                                                    ->  Seq Scan on roles roles_9  (cost=0.00..1.07 rows=1 width=1)'
'                                                          Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                  InitPlan 16'
'                                                    ->  Seq Scan on roles roles_11  (cost=0.00..1.07 rows=1 width=1)'
'                                                          Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                  ->  Nested Loop Left Join  (cost=39.68..67.36 rows=1 width=28)'
'                                                        Join Filter: (hp_1.horario = hc_1.horario)'
'                                                        ->  Nested Loop Left Join  (cost=39.68..66.22 rows=1 width=33)'
'                                                              ->  Nested Loop  (cost=39.54..58.05 rows=1 width=36)'
'                                                                    Join Filter: (f_1.annio = a_1.annio)'
'                                                                    ->  Nested Loop  (cost=39.54..56.96 rows=1 width=40)'
'                                                                          ->  Nested Loop Left Join  (cost=39.26..48.65 rows=1 width=28)'
'                                                                                ->  Index Scan using personas_pkey on personas p_2  (cost=0.28..9.64 rows=1 width=28)'
'                                                                                      Index Cond: (idper = nv.idper)'
'                                                                                      Filter: CASE WHEN (current_setting(''backend_plus._mode''::text) = ''login''::text) THEN true ELSE ((InitPlan 14).col1 OR (SubPlan 15) OR ((InitPlan 16).col1 AND (SubPlan 17))) END'
'                                                                                      SubPlan 15'
'                                                                                        ->  Result  (cost=0.01..1.08 rows=1 width=1)'
'                                                                                              One-Time Filter: (p_2.idper = current_setting(''backend_plus._idper''::text))'
'                                                                                              ->  Seq Scan on roles roles_10  (cost=0.01..1.08 rows=1 width=1)'
'                                                                                                    Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                                                      SubPlan 17'
'                                                                                        ->  Result  (cost=0.00..0.26 rows=1 width=1)'
'                                                                                ->  Limit  (cost=38.99..38.99 rows=1 width=603)'
'                                                                                      InitPlan 18'
'                                                                                        ->  Seq Scan on roles roles_12  (cost=0.00..1.07 rows=1 width=1)'
'                                                                                              Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                                                      InitPlan 20'
'                                                                                        ->  Seq Scan on roles roles_14  (cost=0.00..1.07 rows=1 width=1)'
'                                                                                              Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                                                      ->  Sort  (cost=36.84..36.84 rows=1 width=603)'
'                                                                                            Sort Key: tl.desde DESC, tl.idt DESC'
'                                                                                            ->  Bitmap Heap Scan on trayectoria_laboral tl  (cost=4.29..36.83 rows=1 width=603)'
'                                                                                                  Recheck Cond: (idper = p_2.idper)'
'                                                                                                  Filter: (propio AND CASE WHEN (current_setting(''backend_plus._mode''::text) = ''login''::text) THEN true ELSE ((InitPlan 18).col1 OR (SubPlan 19) OR ((InitPlan 20).col1 AND (SubPlan 26))) END AND (lapso_fechas @> nv.fecha))'
'                                                                                                  ->  Bitmap Index Scan on "idper 4 trayectoria_laboral IDX"  (cost=0.00..4.29 rows=2 width=0)'
'                                                                                                        Index Cond: (idper = p_2.idper)'
'                                                                                                  SubPlan 19'
'                                                                                                    ->  Result  (cost=0.01..1.08 rows=1 width=1)'
'                                                                                                          One-Time Filter: (tl.idper = current_setting(''backend_plus._idper''::text))'
'                                                                                                          ->  Seq Scan on roles roles_13  (cost=0.01..1.08 rows=1 width=1)'
'                                                                                                                Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                                                                  SubPlan 26'
'                                                                                                    ->  Result  (cost=11.79..12.05 rows=1 width=1)'
'                                                                                                          InitPlan 25'
'                                                                                                            ->  Index Scan using personas_pkey on personas personas_1  (cost=2.42..11.79 rows=1 width=5)'
'                                                                                                                  Index Cond: (idper = tl.idper)'
'                                                                                                                  Filter: CASE WHEN (current_setting(''backend_plus._mode''::text) = ''login''::text) THEN true ELSE ((InitPlan 21).col1 OR (SubPlan 22) OR ((InitPlan 23).col1 AND (SubPlan 24))) END'
'                                                                                                                  InitPlan 21'
'                                                                                                                    ->  Seq Scan on roles roles_15  (cost=0.00..1.07 rows=1 width=1)'
'                                                                                                                          Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                                                                                  InitPlan 23'
'                                                                                                                    ->  Seq Scan on roles roles_17  (cost=0.00..1.07 rows=1 width=1)'
'                                                                                                                          Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                                                                                  SubPlan 22'
'                                                                                                                    ->  Result  (cost=0.01..1.08 rows=1 width=1)'
'                                                                                                                          One-Time Filter: (personas_1.idper = current_setting(''backend_plus._idper''::text))'
'                                                                                                                          ->  Seq Scan on roles roles_16  (cost=0.01..1.08 rows=1 width=1)'
'                                                                                                                                Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                                                                                  SubPlan 24'
'                                                                                                                    ->  Result  (cost=0.00..0.26 rows=1 width=1)'
'                                                                          ->  Index Scan using fechas_pkey on fechas f_1  (cost=0.28..8.29 rows=1 width=12)'
'                                                                                Index Cond: (fecha = nv.fecha)'
'                                                                    ->  Seq Scan on annios a_1  (cost=0.00..1.04 rows=4 width=4)'
'                                                              ->  Index Scan using "sin superponer fechas" on horarios_per hp_1  (cost=0.14..8.16 rows=1 width=23)'
'                                                                    Index Cond: ((idper = nv.idper) AND (lapso_fechas @> f_1.fecha))'
'                                                        ->  Seq Scan on horarios_cod hc_1  (cost=0.00..1.06 rows=6 width=36)'
'                                                  ->  Seq Scan on parametros par_1  (cost=0.00..1.01 rows=1 width=4)'
'                                ->  Materialize  (cost=0.00..2.06 rows=2 width=32)'
'                                      ->  Nested Loop  (cost=0.00..2.05 rows=2 width=32)'
'                                            ->  Seq Scan on parametros  (cost=0.00..1.01 rows=1 width=0)'
'                                            ->  Seq Scan on bandas_horarias bh  (cost=0.00..1.02 rows=2 width=32)'
'                          ->  Memoize  (cost=0.15..0.18 rows=1 width=4)'
'                                Cache Key: nv.cod_nov'
'                                Cache Mode: logical'
'                                ->  Index Scan using cod_novedades_pkey on cod_novedades cn  (cost=0.14..0.17 rows=1 width=4)'
'                                      Index Cond: (cod_nov = nv.cod_nov)'
'        ->  Nested Loop Left Join  (cost=40.58..52.93 rows=1 width=24)'
'              ->  Nested Loop Left Join  (cost=40.45..52.75 rows=1 width=33)'
'                    Join Filter: (hp.lapso_fechas @> f.fecha)'
'                    ->  Nested Loop  (cost=40.31..52.44 rows=1 width=32)'
'                          Join Filter: (f.annio = a.annio)'
'                          ->  Nested Loop  (cost=40.31..51.35 rows=1 width=36)'
'                                ->  Nested Loop  (cost=39.77..42.79 rows=1 width=24)'
'                                      ->  Nested Loop Left Join  (cost=39.77..41.77 rows=1 width=24)'
'                                            ->  Index Scan using personas_pkey on personas p  (cost=0.28..2.25 rows=1 width=29)'
'                                                  Index Cond: (idper = nv.idper)'
'                                                  Filter: CASE WHEN (current_setting(''backend_plus._mode''::text) = ''login''::text) THEN true ELSE ((InitPlan 1).col1 OR (SubPlan 2) OR ((InitPlan 3).col1 AND (SubPlan 4))) END'
'                                                  SubPlan 2'
'                                                    ->  Result  (cost=0.01..1.08 rows=1 width=1)'
'                                                          One-Time Filter: (p.idper = current_setting(''backend_plus._idper''::text))'
'                                                          ->  Seq Scan on roles roles_1  (cost=0.01..1.08 rows=1 width=1)'
'                                                                Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                  SubPlan 4'
'                                                    ->  Result  (cost=0.00..0.26 rows=1 width=1)'
'                                            ->  Limit  (cost=39.50..39.50 rows=1 width=603)'
'                                                  InitPlan 27'
'                                                    ->  Seq Scan on roles roles_18  (cost=0.00..1.07 rows=1 width=1)'
'                                                          Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                  InitPlan 29'
'                                                    ->  Seq Scan on roles roles_20  (cost=0.00..1.07 rows=1 width=1)'
'                                                          Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                  ->  Sort  (cost=37.35..37.35 rows=1 width=603)'
'                                                        Sort Key: tl_1.desde DESC, tl_1.idt DESC'
'                                                        ->  Bitmap Heap Scan on trayectoria_laboral tl_1  (cost=4.29..37.34 rows=1 width=603)'
'                                                              Recheck Cond: (idper = p.idper)'
'                                                              Filter: (propio AND CASE WHEN (current_setting(''backend_plus._mode''::text) = ''login''::text) THEN true ELSE ((InitPlan 27).col1 OR (SubPlan 28) OR ((InitPlan 29).col1 AND (SubPlan 35))) END AND (lapso_fechas @> (date_trunc(''day''::text, fecha_hora_actual()))::date))'
'                                                              ->  Bitmap Index Scan on "idper 4 trayectoria_laboral IDX"  (cost=0.00..4.29 rows=2 width=0)'
'                                                                    Index Cond: (idper = p.idper)'
'                                                              SubPlan 28'
'                                                                ->  Result  (cost=0.01..1.08 rows=1 width=1)'
'                                                                      One-Time Filter: (tl_1.idper = current_setting(''backend_plus._idper''::text))'
'                                                                      ->  Seq Scan on roles roles_19  (cost=0.01..1.08 rows=1 width=1)'
'                                                                            Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                              SubPlan 35'
'                                                                ->  Result  (cost=11.79..12.05 rows=1 width=1)'
'                                                                      InitPlan 34'
'                                                                        ->  Index Scan using personas_pkey on personas personas_2  (cost=2.42..11.79 rows=1 width=5)'
'                                                                              Index Cond: (idper = tl_1.idper)'
'                                                                              Filter: CASE WHEN (current_setting(''backend_plus._mode''::text) = ''login''::text) THEN true ELSE ((InitPlan 30).col1 OR (SubPlan 31) OR ((InitPlan 32).col1 AND (SubPlan 33))) END'
'                                                                              InitPlan 30'
'                                                                                ->  Seq Scan on roles roles_21  (cost=0.00..1.07 rows=1 width=1)'
'                                                                                      Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                                              InitPlan 32'
'                                                                                ->  Seq Scan on roles roles_23  (cost=0.00..1.07 rows=1 width=1)'
'                                                                                      Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                                              SubPlan 31'
'                                                                                ->  Result  (cost=0.01..1.08 rows=1 width=1)'
'                                                                                      One-Time Filter: (personas_2.idper = current_setting(''backend_plus._idper''::text))'
'                                                                                      ->  Seq Scan on roles roles_22  (cost=0.01..1.08 rows=1 width=1)'
'                                                                                            Filter: (rol = current_setting(''backend_plus._rol''::text))'
'                                                                              SubPlan 33'
'                                                                                ->  Result  (cost=0.00..0.26 rows=1 width=1)'
'                                      ->  Seq Scan on parametros par  (cost=0.00..1.01 rows=1 width=0)'
'                                ->  Index Scan using fechas_pkey on fechas f  (cost=0.53..8.55 rows=1 width=12)'
'                                      Index Cond: (fecha = (date_trunc(''day''::text, fecha_hora_actual()))::date)'
'                          ->  Seq Scan on annios a  (cost=0.00..1.04 rows=4 width=4)'
'                    ->  Index Scan using "sin superponer fechas" on horarios_per hp  (cost=0.14..0.28 rows=2 width=23)'
'                          Index Cond: (idper = p.idper)'
'              ->  Index Only Scan using horarios_cod_pkey on horarios_cod hc  (cost=0.13..0.17 rows=1 width=32)'
'                    Index Cond: (horario = hp.horario)'
'  ->  Index Scan using sectores_pkey on sectores  (cost=0.14..0.27 rows=1 width=46)'
'        Index Cond: (sector = p_1.sector)'
```

Las políticas definidas son:
```sql
ALTER TABLE "personas" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp base" ON "personas" AS PERMISSIVE FOR all TO siper_muleto_admin USING ( true );
CREATE POLICY "bp select" ON "personas" AS RESTRICTIVE FOR select TO siper_muleto_admin USING ( (case when get_app_user('mode') = 'login' then true else ( -- PUEDE TODO:
                SELECT puede_ver_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_ver_propio FROM roles WHERE rol = get_app_user('rol') AND personas.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_ver_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        sector,
                        get_app_user('sector')
                    )
                )
            )
         end) );
CREATE POLICY "bp insert" ON "personas" AS RESTRICTIVE FOR insert TO siper_muleto_admin WITH CHECK ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND personas.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        sector,
                        get_app_user('sector')
                    )
                )
            )
        ) );
CREATE POLICY "bp update" ON "personas" AS RESTRICTIVE FOR update TO siper_muleto_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND personas.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        sector,
                        get_app_user('sector')
                    )
                )
            )
        ) );
CREATE POLICY "bp delete" ON "personas" AS RESTRICTIVE FOR delete TO siper_muleto_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND personas.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        sector,
                        get_app_user('sector')
                    )
                )
            )
        ) );
ALTER TABLE "novedades_registradas" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp base" ON "novedades_registradas" AS PERMISSIVE FOR all TO siper_muleto_admin USING ( true );
CREATE POLICY "bp select" ON "novedades_registradas" AS RESTRICTIVE FOR select TO siper_muleto_admin USING ( ( -- PUEDE TODO:
                SELECT puede_ver_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_ver_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_registradas.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_ver_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_registradas.idper),
                        get_app_user('sector')
                    )
                )
            )
         );
CREATE POLICY "bp insert" ON "novedades_registradas" AS RESTRICTIVE FOR insert TO siper_muleto_admin WITH CHECK ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_registradas.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_registradas.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            ( 
                CASE WHEN desde > fecha_actual() THEN true WHEN desde < fecha_actual() THEN false ELSE (SELECT fecha_hora_actual() - fecha_actual() <= carga_nov_hasta_hora FROM parametros) END 
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
CREATE POLICY "bp update" ON "novedades_registradas" AS RESTRICTIVE FOR update TO siper_muleto_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_registradas.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_registradas.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            ( 
                CASE WHEN desde > fecha_actual() THEN true WHEN desde < fecha_actual() THEN false ELSE (SELECT fecha_hora_actual() - fecha_actual() <= carga_nov_hasta_hora FROM parametros) END 
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
CREATE POLICY "bp delete" ON "novedades_registradas" AS RESTRICTIVE FOR delete TO siper_muleto_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_registradas.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_registradas.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            ( 
                CASE WHEN desde > fecha_actual() THEN true WHEN desde < fecha_actual() THEN false ELSE (SELECT fecha_hora_actual() - fecha_actual() <= carga_nov_hasta_hora FROM parametros) END 
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
ALTER TABLE "novedades_horarias" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp base" ON "novedades_horarias" AS PERMISSIVE FOR all TO siper_muleto_admin USING ( true );
CREATE POLICY "bp select" ON "novedades_horarias" AS RESTRICTIVE FOR select TO siper_muleto_admin USING ( ( -- PUEDE TODO:
                SELECT puede_ver_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_ver_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_horarias.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_ver_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_horarias.idper),
                        get_app_user('sector')
                    )
                )
            )
         );
CREATE POLICY "bp insert" ON "novedades_horarias" AS RESTRICTIVE FOR insert TO siper_muleto_admin WITH CHECK ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_horarias.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_horarias.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            ( 
                CASE WHEN fecha > fecha_actual() THEN true WHEN fecha < fecha_actual() THEN false ELSE (SELECT fecha_hora_actual() - fecha_actual() <= carga_nov_hasta_hora FROM parametros) END 
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
CREATE POLICY "bp update" ON "novedades_horarias" AS RESTRICTIVE FOR update TO siper_muleto_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_horarias.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_horarias.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            ( 
                CASE WHEN fecha > fecha_actual() THEN true WHEN fecha < fecha_actual() THEN false ELSE (SELECT fecha_hora_actual() - fecha_actual() <= carga_nov_hasta_hora FROM parametros) END 
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
CREATE POLICY "bp delete" ON "novedades_horarias" AS RESTRICTIVE FOR delete TO siper_muleto_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_horarias.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_horarias.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            ( 
                CASE WHEN fecha > fecha_actual() THEN true WHEN fecha < fecha_actual() THEN false ELSE (SELECT fecha_hora_actual() - fecha_actual() <= carga_nov_hasta_hora FROM parametros) END 
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
ALTER TABLE "novedades_vigentes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp base" ON "novedades_vigentes" AS PERMISSIVE FOR all TO siper_muleto_admin USING ( true );
CREATE POLICY "bp select" ON "novedades_vigentes" AS RESTRICTIVE FOR select TO siper_muleto_admin USING ( ( -- PUEDE TODO:
                SELECT puede_ver_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_ver_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_vigentes.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_ver_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_vigentes.idper),
                        get_app_user('sector')
                    )
                )
            )
         );
CREATE POLICY "bp insert" ON "novedades_vigentes" AS RESTRICTIVE FOR insert TO siper_muleto_admin WITH CHECK ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_vigentes.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_vigentes.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            ( 
                CASE WHEN fecha > fecha_actual() THEN true WHEN fecha < fecha_actual() THEN false ELSE (SELECT fecha_hora_actual() - fecha_actual() <= carga_nov_hasta_hora FROM parametros) END 
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
CREATE POLICY "bp update" ON "novedades_vigentes" AS RESTRICTIVE FOR update TO siper_muleto_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_vigentes.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_vigentes.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            ( 
                CASE WHEN fecha > fecha_actual() THEN true WHEN fecha < fecha_actual() THEN false ELSE (SELECT fecha_hora_actual() - fecha_actual() <= carga_nov_hasta_hora FROM parametros) END 
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
CREATE POLICY "bp delete" ON "novedades_vigentes" AS RESTRICTIVE FOR delete TO siper_muleto_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_vigentes.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_vigentes.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            ( 
                CASE WHEN fecha > fecha_actual() THEN true WHEN fecha < fecha_actual() THEN false ELSE (SELECT fecha_hora_actual() - fecha_actual() <= carga_nov_hasta_hora FROM parametros) END 
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
ALTER TABLE "trayectoria_laboral" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp base" ON "trayectoria_laboral" AS PERMISSIVE FOR all TO siper_muleto_admin USING ( true );
CREATE POLICY "bp select" ON "trayectoria_laboral" AS RESTRICTIVE FOR select TO siper_muleto_admin USING ( (case when get_app_user('mode') = 'login' then true else ( -- PUEDE TODO:
                SELECT puede_ver_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_ver_propio FROM roles WHERE rol = get_app_user('rol') AND trayectoria_laboral.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_ver_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = trayectoria_laboral.idper),
                        get_app_user('sector')
                    )
                )
            )
         end) );
CREATE POLICY "bp insert" ON "trayectoria_laboral" AS RESTRICTIVE FOR insert TO siper_muleto_admin WITH CHECK ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND trayectoria_laboral.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = trayectoria_laboral.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) );
CREATE POLICY "bp update" ON "trayectoria_laboral" AS RESTRICTIVE FOR update TO siper_muleto_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND trayectoria_laboral.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = trayectoria_laboral.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) );
CREATE POLICY "bp delete" ON "trayectoria_laboral" AS RESTRICTIVE FOR delete TO siper_muleto_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND trayectoria_laboral.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = trayectoria_laboral.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) );-- install/../node_modules/pg-triggers/lib/recreate-his.sql
```

Estos son los datos de la tabla roles:
```
'rol','descripcion','puede_ver_novedades','puede_cargar_todo','puede_ver_todo','puede_cargar_dependientes','puede_ver_dependientes','puede_cargar_propio','puede_ver_propio','puede_corregir_el_pasado'
'basico',,,false,false,false,false,false,true,false
'registra',,,false,false,false,true,false,true,false
'superior',,,true,true,true,true,false,true,true
'rrhh',,,true,true,true,true,false,true,false
'admin',,,true,true,true,true,false,true,true
```

El rol es `registra` (eso devuelve `get_app_user('rol')`)