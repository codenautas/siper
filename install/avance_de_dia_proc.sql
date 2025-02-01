-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

create or replace procedure avance_de_dia_proc()
  language sql
  security definer
begin atomic
  update parametros 
    set fecha_actual = current_date 
    where avance_dia_automatico and fecha_actual + '3 hours'::interval < current_timestamp; -- cambia a las 3 del día siguiente
end;

/* 
-- alter table parametros add column avance_dia_automatico boolean;
update parametros set  avance_dia_automatico = true, fecha_actual = '2024-4-4';

call avance_de_dia_proc();

select * from parametros;
*/