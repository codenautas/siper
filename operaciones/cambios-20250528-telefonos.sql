set role to siper_owner;
set search_path = "siper", public;

create table "tipos_telefono" (
  "tipo_telefono" text, 
  "descripcion" text, 
  "orden" integer
, primary key ("tipo_telefono")
);
grant select, insert, update, delete on "tipos_telefono" to siper_admin;
grant all on "tipos_telefono" to siper_owner;

create table "per_telefonos" (
  "idper" text, 
  "nro_item" bigint, 
  "tipo_telefono" text, 
  "telefono" text, 
  "observaciones" text
, primary key ("idper", "nro_item")
);
grant select, insert, update, delete on "per_telefonos" to siper_admin;
grant all on "per_telefonos" to siper_owner;

-- install/../install/per_telefonos_pk_trg.sql
/* PARA CORRERLO VARIAS VECES. No COMMITEAR descomentado
  set role to siper_owner; 
  set search_path = siper;
  DROP TRIGGER IF EXISTS per_telefonos_pk_trg ON per_telefonos;
  DROP FUNCTION IF EXISTS per_telefonos_pk_trg();
  DROP FUNCTION IF EXISTS get_next_telefono_number(p_idper text);
-- */

CREATE or REPLACE FUNCTION get_next_telefono_number(p_idper text) RETURNS bigint
  LANGUAGE SQL SECURITY DEFINER
AS
$SQL$
  SELECT coalesce((SELECT max(nro_item + 1) FROM per_telefonos WHERE idper = p_idper), 1)
$SQL$;

CREATE OR REPLACE FUNCTION per_telefonos_pk_trg()
    RETURNS trigger
    LANGUAGE 'plpgsql' 
AS $BODY$
declare
  v_ultimo bigint;
begin
  if new.nro_item <> 0 then
    null;
  else
    new.nro_item := get_next_telefono_number(new.idper);
  end if;
  return new;
end;
$BODY$;

CREATE TRIGGER per_telefonos_pk_trg
   before INSERT 
   ON per_telefonos
   FOR EACH ROW
   EXECUTE PROCEDURE per_telefonos_pk_trg();   

-- table data: install\tipos_telefono.tab
insert into "tipos_telefono" ("tipo_telefono", "descripcion", "orden") values
('CEL', 'CELULAR', '1'),
('LAB', 'LABORAL', '2'),
('PART', 'PARTICULAR', '3');

alter table "tipos_telefono" add constraint "tipo_telefono<>''" check ("tipo_telefono"<>'');
alter table "tipos_telefono" add constraint "descripcion<>''" check ("descripcion"<>'');
alter table "tipos_telefono" add constraint "palabra corta y solo mayusculas en tipo_telefono" check (tipo_telefono similar to '[A-Z][A-Z0-9]{0,9}|[1-9]\d{0,10}');

alter table "per_telefonos" add constraint "idper<>''" check ("idper"<>'');
alter table "per_telefonos" add constraint "tipo_telefono<>''" check ("tipo_telefono"<>'');
alter table "per_telefonos" add constraint "telefono<>''" check ("telefono"<>'');
alter table "per_telefonos" add constraint "observaciones<>''" check ("observaciones"<>'');

alter table "per_telefonos" add constraint "per_telefonos personas REL" foreign key ("idper") references "personas" ("idper")  on update cascade;
alter table "per_telefonos" add constraint "per_telefonos tipos_telefono REL" foreign key ("tipo_telefono") references "tipos_telefono" ("tipo_telefono")  on update cascade;

create index "idper 4 per_telefonos IDX" ON "per_telefonos" ("idper");
create index "tipo_telefono 4 per_telefonos IDX" ON "per_telefonos" ("tipo_telefono");


do $SQL_ENANCE$
begin
PERFORM enance_table('tipos_telefono','tipo_telefono');
PERFORM enance_table('per_telefonos','idper,nro_item');
end
$SQL_ENANCE$;