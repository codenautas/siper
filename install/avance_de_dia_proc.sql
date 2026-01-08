-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

create or replace procedure avance_de_dia_proc()
  language sql
  security definer
begin atomic
  UPDATE fechas f
    SET cod_nov_pred_fecha = cod_nov_habitual
    FROM parametros, annios a
    WHERE cod_nov_pred_fecha is null
      AND fecha <= fecha_actual()
      AND f.annio = a.annio
      AND a.abierto;
end;

/* 
-- alter table parametros add column avance_dia_automatico boolean;
update parametros set  avance_dia_automatico = true, fecha_actual = '2024-4-4';

call avance_de_dia_proc();

select * from parametros;
*/