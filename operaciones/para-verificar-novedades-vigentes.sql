set role to siper_owner;
set search_path = siper;

-- Antes de cambiar algo crítico

create table his.novedades_vigentes_2026_03_15
  as select * from siper.novedades_vigentes;

alter table his.novedades_vigentes_2026_03_15 add CONSTRAINT novedades_vigentes_pkey PRIMARY KEY (idper, fecha);


-- Después de modificar la función de cálculo de fichadas o de novedades registradas 
-- probablemente haya que recalcular todo el año abierto:

CALL actualizar_novedades_vigentes('2026-01-01'::date, '2026-12-31'::date);
-- demora 10 segundos con registro de 3 meses, quizás más con más registros

-- Comparar que todo esté igual (menos lo que se espera que no):

select idper, fecha, n.cod_nov cod_n, v.cod_nov cod_v, to_jsonb(n.*) datos_n, to_jsonb(v.*) datos_v
  from siper.novedades_vigentes n full outer join his.novedades_vigentes_2026_03_15 v using (idper, fecha)
    inner join personas using (idper)
  where (to_jsonb(n.*) - 'sector' - 'ficha') is distinct from (to_jsonb(v.*) - 'sector' - 'ficha')
    and (fecha_egreso is null or fecha<=fecha_egreso)
  order by idper, fecha;
  