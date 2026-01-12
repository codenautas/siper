set search_path=siper;
SET ROLE siper_owner; -- el que corresponda

CREATE OR REPLACE FUNCTION siper.get_telefonos(
	p_idper text)
    RETURNS text
    LANGUAGE 'sql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
  SELECT string_agg(tipo_telefono || ':' ||telefono, ' , ') as telefonos FROM siper.per_telefonos WHERE idper = p_idper
$BODY$;

ALTER FUNCTION siper.get_telefonos(text)
    OWNER TO siper_owner;