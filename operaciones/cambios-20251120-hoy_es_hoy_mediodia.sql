set search_path = siper;
set role siper_owner;

ALTER TABLE parametros ADD COLUMN fecha_hora_actual timestamp without time zone;
ALTER TABLE parametros ADD COLUMN actualizar_hasta_hora TIME;

update parametros set actualizar_hasta_hora = '12:00:00';

CREATE OR REPLACE FUNCTION fecha_hora() returns date
   language sql
   AS
   $BODY$
   SELECT coalesce(date_trunc('day', fecha_hora_actual), current_date)
     from parametros
     where unico_registro;
   $BODY$;