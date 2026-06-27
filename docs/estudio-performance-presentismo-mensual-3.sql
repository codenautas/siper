/*
# Material de estudio-performance-presentismo-mensual.md

probar con:
```
psql -P pager=off -f docs\estudio-performance-presentismo-mensual.sql siper_muleto_db
```q

## Calendario de un empleado en un mes

*/

set role to siper_muleto_admin;
set SEARCH_PATH TO "siper","public";

CALL set_app_user('regis');

BEGIN;

\timing on

select case when extract(year from f.fecha) = x.annio then f.fecha else null end as fecha,
                        extract(day from f.fecha) as dia,
                        f.dds,
                        (f.fecha - '2001-01-01'::date - dds) / 7 as semana,
                        v.cod_nov,
                        case f.dds
                            when 0 then 'no-laborable' 
                            when 6 then 'no-laborable' 
                            else 
                                case 
                                    when laborable is false then 'no-laborable' 
                                    else 'normal' 
                                end 
                        end as tipo_dia,
                        cn.novedad,
                        extract(month from f.fecha) = mes as mismo_mes,
                        v.fichadas,
                        v.horas,
                        f.fichadas_consolidadas or f.fecha < coalesce(p.inicia_fichada, p.registra_novedades_desde) as consolidada,
                        cn.requiere_fichadas,
                        cn.injustificado
                    from (
                        select  fecha - 2 - extract(dow from f.fecha - 2)::integer      as desde,
                                fecha - 2 - extract(dow from f.fecha - 2)::integer + 41 as hasta,
                                -- (fecha + interval '1 month')::date - extract(dow from (fecha + interval '1 month'))::integer + 6 as hasta,
                                extract(month from f.fecha) as mes,
                                extract(year from f.fecha) as annio
                            from fechas f
                            where fecha = '2026-06-01'::date
                        ) x, 
                        lateral (select * from fechas where annio = x.annio) f
                        left join novedades_vigentes v on v.fecha = f.fecha and v.idper = 'RA4'
                        left join personas p on p.idper = v.idper
                        left join cod_novedades cn on cn.cod_nov = v.cod_nov
                    where f.fecha between desde and hasta
                    order by f.fecha;

\timing off

set role to siper_muleto_owner;

DROP POLICY "bp select" ON novedades_vigentes;
CREATE POLICY "bp select" ON novedades_vigentes AS RESTRICTIVE FOR select TO siper_muleto_admin
    USING ( novedades_vigentes.idper IN (SELECT idper FROM personas) );

set role to siper_muleto_admin;

CALL set_app_user('regis');

\timing on

select case when extract(year from f.fecha) = x.annio then f.fecha else null end as fecha,
                        extract(day from f.fecha) as dia,
                        f.dds,
                        (f.fecha - '2001-01-01'::date - dds) / 7 as semana,
                        v.cod_nov,
                        case f.dds
                            when 0 then 'no-laborable' 
                            when 6 then 'no-laborable' 
                            else 
                                case 
                                    when laborable is false then 'no-laborable' 
                                    else 'normal' 
                                end 
                        end as tipo_dia,
                        cn.novedad,
                        extract(month from f.fecha) = mes as mismo_mes,
                        v.fichadas,
                        v.horas,
                        f.fichadas_consolidadas or f.fecha < coalesce(p.inicia_fichada, p.registra_novedades_desde) as consolidada,
                        cn.requiere_fichadas,
                        cn.injustificado
                    from (
                        select  fecha - 2 - extract(dow from f.fecha - 2)::integer      as desde,
                                fecha - 2 - extract(dow from f.fecha - 2)::integer + 41 as hasta,
                                -- (fecha + interval '1 month')::date - extract(dow from (fecha + interval '1 month'))::integer + 6 as hasta,
                                extract(month from f.fecha) as mes,
                                extract(year from f.fecha) as annio
                            from fechas f
                            where fecha = '2026-06-01'::date
                        ) x, 
                        lateral (select * from fechas where annio = x.annio) f
                        left join novedades_vigentes v on v.fecha = f.fecha and v.idper = 'RA4'
                        left join personas p on p.idper = v.idper
                        left join cod_novedades cn on cn.cod_nov = v.cod_nov
                    where f.fecha between desde and hasta
                    order by f.fecha;

\timing off

ROLLBACK;

