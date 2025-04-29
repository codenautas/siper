set search_path = "siper";
-- AJUSTAR ADMIN Y OWNER SEGUN ENTORNO

--TABLAS
create table "adjuntos_persona" (
  "idper" text, 
  "numero_adjunto" bigint, 
  "tipo_adjunto_persona" text, 
  "timestamp" timestamp default current_timestamp, 
  "archivo_nombre" text, 
  "archivo_nombre_fisico" text
, primary key ("idper", "numero_adjunto")
);
grant select, insert, update, delete on "adjuntos_persona" to siper_admin;
grant all on "adjuntos_persona" to siper_owner;


CREATE SEQUENCE "numero_adjunto_seq" START 101;
ALTER TABLE "adjuntos_persona" ALTER COLUMN "numero_adjunto" SET DEFAULT nextval('numero_adjunto_seq'::regclass);
GRANT USAGE, SELECT ON SEQUENCE "numero_adjunto_seq" TO siper_admin;

create table "tipos_adjunto_persona" (
  "tipo_adjunto_persona" text, 
  "descripcion" text
, primary key ("tipo_adjunto_persona")
);
grant select, insert, update, delete on "tipos_adjunto_persona" to siper_admin;
grant all on "tipos_adjunto_persona" to siper_owner;



create table "tipos_adjunto_persona_atributos" (
  "tipo_adjunto_persona" text, 
  "atributo" text, 
  "orden" integer, 
  "columna" integer
, primary key ("tipo_adjunto_persona", "atributo")
);
grant select, insert, update, delete on "tipos_adjunto_persona_atributos" to siper_admin;
grant all on "tipos_adjunto_persona_atributos" to siper_owner;



create table "adjuntos_persona_atributos" (
  "idper" text, 
  "numero_adjunto" bigint, 
  "tipo_adjunto_persona" text, 
  "atributo" text, 
  "valor" text
, primary key ("idper", "numero_adjunto", "atributo")
);
grant select, insert, update, delete on "adjuntos_persona_atributos" to siper_admin;
grant all on "adjuntos_persona_atributos" to siper_owner;



create table "archivos_borrar" (
  "ruta_archivo" text
, primary key ("ruta_archivo")
);
grant select, insert, update, delete on "archivos_borrar" to siper_admin;
grant all on "archivos_borrar" to siper_owner;




--TRIGERS
-- install/../install/archivo_borrar_trg.sql
CREATE OR REPLACE FUNCTION archivo_borrar_trg()
    RETURNS trigger
    LANGUAGE 'plpgsql' 
AS $BODY$
begin
  if old.archivo_nombre_fisico is not null then
    insert into archivos_borrar ("ruta_archivo") values (old.archivo_nombre_fisico);
  end if;
  return old;
end;
$BODY$;

CREATE TRIGGER archivo_borrar_trg
  BEFORE DELETE 
  ON adjuntos_persona
  FOR EACH ROW
  EXECUTE PROCEDURE archivo_borrar_trg();


--CONSS
alter table "adjuntos_persona" add constraint "idper<>''" check ("idper"<>'');
alter table "adjuntos_persona" add constraint "tipo_adjunto_persona<>''" check ("tipo_adjunto_persona"<>'');
alter table "adjuntos_persona" add constraint "archivo_nombre<>''" check ("archivo_nombre"<>'');
alter table "adjuntos_persona" add constraint "archivo_nombre_fisico<>''" check ("archivo_nombre_fisico"<>'');
alter table "tipos_adjunto_persona" add constraint "tipo_adjunto_persona<>''" check ("tipo_adjunto_persona"<>'');
alter table "tipos_adjunto_persona" add constraint "descripcion<>''" check ("descripcion"<>'');
alter table "tipos_adjunto_persona" add constraint "palabra corta y solo mayusculas en tipo_adjunto_persona" check (tipo_adjunto_persona similar to '[A-Z][A-Z0-9]{0,9}|[1-9]\d{0,10}');
alter table "tipos_adjunto_persona_atributos" add constraint "tipo_adjunto_persona<>''" check ("tipo_adjunto_persona"<>'');
alter table "tipos_adjunto_persona_atributos" alter column "tipo_adjunto_persona" set not null;
alter table "tipos_adjunto_persona_atributos" add constraint "atributo<>''" check ("atributo"<>'');
alter table "tipos_adjunto_persona_atributos" alter column "atributo" set not null;
alter table "tipos_adjunto_persona_atributos" alter column "orden" set not null;
alter table "tipos_adjunto_persona_atributos" alter column "columna" set not null;
alter table "adjuntos_persona_atributos" add constraint "idper<>''" check ("idper"<>'');
alter table "adjuntos_persona_atributos" add constraint "tipo_adjunto_persona<>''" check ("tipo_adjunto_persona"<>'');
alter table "adjuntos_persona_atributos" alter column "tipo_adjunto_persona" set not null;
alter table "adjuntos_persona_atributos" add constraint "atributo<>''" check ("atributo"<>'');
alter table "adjuntos_persona_atributos" add constraint "valor<>''" check ("valor"<>'');
alter table "archivos_borrar" add constraint "ruta_archivo<>''" check ("ruta_archivo"<>'');


--FKs
alter table "adjuntos_persona" add constraint "adjuntos_persona tipos_adjunto_persona REL" foreign key ("tipo_adjunto_persona") references "tipos_adjunto_persona" ("tipo_adjunto_persona")  on update cascade;
alter table "tipos_adjunto_persona_atributos" add constraint "tipos_adjunto_persona_atributos tipos_adjunto_persona REL" foreign key ("tipo_adjunto_persona") references "tipos_adjunto_persona" ("tipo_adjunto_persona")  on update cascade;
alter table "adjuntos_persona_atributos" add constraint "adjuntos_persona_atributos tipos_adjunto_persona_atributos REL" foreign key ("tipo_adjunto_persona", "atributo") references "tipos_adjunto_persona_atributos" ("tipo_adjunto_persona", "atributo")  on update cascade;
alter table "adjuntos_persona_atributos" add constraint "adjuntos_persona_atributos adjuntos_persona REL" foreign key ("idper", "numero_adjunto") references "adjuntos_persona" ("idper", "numero_adjunto")  on update cascade;


--INDEX
create index "tipo_adjunto_persona 4 adjuntos_persona IDX" ON "adjuntos_persona" ("tipo_adjunto_persona");
create index "tipo_adjunto_persona 4 tipos_adjunto_persona_atributos IDX" ON "tipos_adjunto_persona_atributos" ("tipo_adjunto_persona");
create index "adjuntos_persona_atributos tipos_adjunto_persona_atributos IDX" ON "adjuntos_persona_atributos" ("tipo_adjunto_persona", "atributo");
create index "idper,numero_adjunto 4 adjuntos_persona_atributos IDX" ON "adjuntos_persona_atributos" ("idper", "numero_adjunto");


--ADAPT
do $SQL_ENANCE$
 begin
PERFORM enance_table('adjuntos_persona','idper,numero_adjunto');
PERFORM enance_table('tipos_adjunto_persona','tipo_adjunto_persona');
PERFORM enance_table('tipos_adjunto_persona_atributos','tipo_adjunto_persona,atributo');
PERFORM enance_table('adjuntos_persona_atributos','idper,numero_adjunto,atributo');
PERFORM enance_table('archivos_borrar','ruta_archivo');
end
$SQL_ENANCE$;



-- table data: ..\siper-data\demo\tipos_adjunto_person.tab
insert into "tipos_adjunto_persona" ("tipo_adjunto_persona", "descripcion") values
('SEC', 'Secreto Estadístico'),
('COM', 'Comodato')

