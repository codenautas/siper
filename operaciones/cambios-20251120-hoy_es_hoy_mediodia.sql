set search_path = siper;
set role siper_owner;

ALTER TABLE parametros ADD COLUMN fecha_hora_para_test timestamp without time zone;
ALTER TABLE parametros DROP COLUMN fecha_actual;
ALTER TABLE parametros ADD COLUMN cod_nov_hasta_hora TIME;
ALTER TABLE parametros DROP COLUMN avance_dia_automatico;

drop function procedure if exists avance_de_dia_proc();

update parametros set cod_nov_hasta_hora = '12:00:00';
