SET search_path = siper; SET ROLE siper_owner;

ALTER TABLE tipos_domicilio RENAME COLUMN domicilio TO descripcion;

ALTER TABLE per_domicilios RENAME COLUMN domicilio TO nro_item;

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

CREATE or REPLACE FUNCTION get_next_domicilio_number(p_idper text) RETURNS bigint
  LANGUAGE SQL SECURITY DEFINER
AS
$SQL$
  SELECT coalesce((SELECT max(nro_item + 1) FROM per_domicilios WHERE idper = p_idper), 1)
$SQL$;

 