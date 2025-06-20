/* PARA CORRERLO VARIAS VECES. No COMMITEAR descomentado
  set role to siper_owner; 
  set search_path = siper;
  DROP TRIGGER IF EXISTS per_domicilios_pk_trg ON per_domicilios;
  DROP FUNCTION IF EXISTS per_domicilios_pk_trg();
  DROP FUNCTION IF EXISTS get_next_domicilio_number(p_idper text);
-- */

CREATE or REPLACE FUNCTION get_next_domicilio_number(p_idper text) RETURNS bigint
  LANGUAGE SQL SECURITY DEFINER
AS
$SQL$
  SELECT coalesce((SELECT max(nro_item + 1) FROM per_domicilios WHERE idper = p_idper), 1)
$SQL$;

CREATE OR REPLACE FUNCTION per_domicilios_pk_trg()
    RETURNS trigger
    LANGUAGE 'plpgsql' 
AS $BODY$
declare
  v_ultimo bigint;
begin
  if new.nro_item <> 0 then
    null;
  else
   	new.nro_item := get_next_domicilio_number(new.idper);
  end if;
  return new;
end;
$BODY$;

CREATE TRIGGER per_domicilios_pk_trg
   before INSERT 
   ON per_domicilios
   FOR EACH ROW
   EXECUTE PROCEDURE per_domicilios_pk_trg();   
