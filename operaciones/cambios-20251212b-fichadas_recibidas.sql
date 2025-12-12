set search_path=siper;
SET ROLE siper_muleto_owner;
--SET ROLE siper_owner;
--ojo mirar grants de abajo (test y/o produc segun entorno)

create table "fichadas_recibidas" (
  "idper" text, 
  "fecha" date, 
  "hora" time, 
  "tipo" text, 
  "texto" text, 
  "dispositivo" text, 
  "punto_gps" text, 
  "id_originen" text
, primary key ("idper", "fecha", "hora")
);

grant select, insert, update, delete on "fichadas_recibidas" to siper_admin;

grant all on "fichadas_recibidas" to siper_owner;

alter table "fichadas_recibidas" add constraint "idper<>''" check ("idper"<>'');
alter table "fichadas_recibidas" alter column "idper" set not null;
alter table "fichadas_recibidas" alter column "fecha" set not null;
alter table "fichadas_recibidas" alter column "hora" set not null;
alter table "fichadas_recibidas" add constraint "tipo<>''" check ("tipo"<>'');
alter table "fichadas_recibidas" alter column "tipo" set not null;
alter table "fichadas_recibidas" add constraint "texto<>''" check ("texto"<>'');
alter table "fichadas_recibidas" add constraint "dispositivo<>''" check ("dispositivo"<>'');
alter table "fichadas_recibidas" add constraint "punto_gps<>''" check ("punto_gps"<>'');
alter table "fichadas_recibidas" add constraint "id_originen<>''" check ("id_originen"<>'');

alter table "fichadas_recibidas" add constraint "fichadas_recibidas personas REL" foreign key ("idper") references "personas" ("idper")  on update cascade;
create index "idper 4 fichadas_recibidas IDX" ON "fichadas_recibidas" ("idper");

GRANT USAGE ON SCHEMA siper TO siper_intelektron_test;
--GRANT USAGE ON SCHEMA siper TO siper_intelektron_produc;

grant select, insert on "fichadas_recibidas" to siper_intelektron_test;
--grant select, insert, on "fichadas_recibidas" to siper_intelektron_produc;

GRANT SELECT ON usuarios_habilitados_fichadas TO siper_intelektron_test;
--GRANT SELECT ON usuarios_habilitados_fichadas TO siper_intelektron_produc;