set search_path = "siper";
-- AJUSTAR ADMIN Y OWNER SEGUN ENTORNO

--TABLAS
create table "adjuntos" (
  "idper" text, 
  "numero_adjunto" bigint, 
  "tipo_adjunto" text, 
  "timestamp" timestamp default current_timestamp, 
  "archivo_nombre" text, 
  "archivo_nombre_fisico" text
, primary key ("numero_adjunto")
);
grant select, insert, update, delete on "adjuntos" to siper_admin;
grant all on "adjuntos" to siper_owner;


CREATE SEQUENCE "numero_adjunto_seq" START 101;
ALTER TABLE "adjuntos" ALTER COLUMN "numero_adjunto" SET DEFAULT nextval('numero_adjunto_seq'::regclass);
GRANT USAGE, SELECT ON SEQUENCE "numero_adjunto_seq" TO siper_admin;

create table "tipos_adjunto" (
  "tipo_adjunto" text, 
  "descripcion" text
, primary key ("tipo_adjunto")
);
grant select, insert, update, delete on "tipos_adjunto" to siper_admin;
grant all on "tipos_adjunto" to siper_owner;



create table "tipos_adjunto_atributos" (
  "tipo_adjunto" text, 
  "atributo" text, 
  "orden" integer, 
  "columna" integer
, primary key ("tipo_adjunto", "atributo")
);
grant select, insert, update, delete on "tipos_adjunto_atributos" to siper_admin;
grant all on "tipos_adjunto_atributos" to siper_owner;



create table "adjuntos_atributos" (
  "idper" text, 
  "numero_adjunto" bigint, 
  "tipo_adjunto" text, 
  "atributo" text, 
  "valor" text
, primary key ("numero_adjunto", "atributo")
);
grant select, insert, update, delete on "adjuntos_atributos" to siper_admin;
grant all on "adjuntos_atributos" to siper_owner;



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
  ON adjuntos
  FOR EACH ROW
  EXECUTE PROCEDURE archivo_borrar_trg();


--CONSS
alter table "adjuntos" add constraint "idper<>''" check ("idper"<>'');
alter table "adjuntos" add constraint "tipo_adjunto<>''" check ("tipo_adjunto"<>'');
alter table "adjuntos" add constraint "archivo_nombre<>''" check ("archivo_nombre"<>'');
alter table "adjuntos" add constraint "archivo_nombre_fisico<>''" check ("archivo_nombre_fisico"<>'');
alter table "tipos_adjunto" add constraint "tipo_adjunto<>''" check ("tipo_adjunto"<>'');
alter table "tipos_adjunto" add constraint "descripcion<>''" check ("descripcion"<>'');
alter table "tipos_adjunto" add constraint "palabra corta y solo mayusculas en tipo_adjunto" check (tipo_adjunto similar to '[A-Z][A-Z0-9]{0,9}|[1-9]\d{0,10}');
alter table "tipos_adjunto_atributos" add constraint "tipo_adjunto<>''" check ("tipo_adjunto"<>'');
alter table "tipos_adjunto_atributos" alter column "tipo_adjunto" set not null;
alter table "tipos_adjunto_atributos" add constraint "atributo<>''" check ("atributo"<>'');
alter table "tipos_adjunto_atributos" alter column "atributo" set not null;
alter table "tipos_adjunto_atributos" alter column "orden" set not null;
alter table "tipos_adjunto_atributos" alter column "columna" set not null;
alter table "adjuntos_atributos" add constraint "idper<>''" check ("idper"<>'');
alter table "adjuntos_atributos" add constraint "tipo_adjunto<>''" check ("tipo_adjunto"<>'');
alter table "adjuntos_atributos" alter column "tipo_adjunto" set not null;
alter table "adjuntos_atributos" add constraint "atributo<>''" check ("atributo"<>'');
alter table "adjuntos_atributos" add constraint "valor<>''" check ("valor"<>'');
alter table "archivos_borrar" add constraint "ruta_archivo<>''" check ("ruta_archivo"<>'');


--FKs
alter table "adjuntos" add constraint "adjuntos tipos_adjunto REL" foreign key ("tipo_adjunto") references "tipos_adjunto" ("tipo_adjunto")  on update cascade;
alter table "adjuntos" add constraint "adjuntos personas REL" foreign key ("idper") references "personas" ("idper")  on update cascade;
alter table "tipos_adjunto_atributos" add constraint "tipos_adjunto_atributos tipos_adjunto REL" foreign key ("tipo_adjunto") references "tipos_adjunto" ("tipo_adjunto")  on update cascade;
alter table "adjuntos_atributos" add constraint "adjuntos_atributos tipos_adjunto_atributos REL" foreign key ("tipo_adjunto", "atributo") references "tipos_adjunto_atributos" ("tipo_adjunto", "atributo")  on update cascade;
alter table "adjuntos_atributos" add constraint "adjuntos_atributos adjuntos REL" foreign key ("idper", "numero_adjunto") references "adjuntos" ("idper", "numero_adjunto")  on delete cascade on update cascade;


--INDEX
create index "tipo_adjunto 4 adjuntos IDX" ON "adjuntos" ("tipo_adjunto");
create index "idper 4 adjuntos IDX" ON "adjuntos" ("idper");
create index "tipo_adjunto 4 tipos_adjunto_atributos IDX" ON "tipos_adjunto_atributos" ("tipo_adjunto");
create index "tipo_adjunto,atributo 4 adjuntos_atributos IDX" ON "adjuntos_atributos" ("tipo_adjunto", "atributo");
create index "idper,numero_adjunto 4 adjuntos_atributos IDX" ON "adjuntos_atributos" ("idper", "numero_adjunto");


--ADAPT
do $SQL_ENANCE$
 begin
PERFORM enance_table('adjuntos','numero_adjunto');
PERFORM enance_table('tipos_adjunto','tipo_adjunto');
PERFORM enance_table('tipos_adjunto_atributos','tipo_adjunto,atributo');
PERFORM enance_table('adjuntos_atributos','numero_adjunto,atributo');
PERFORM enance_table('archivos_borrar','ruta_archivo');
end
$SQL_ENANCE$;



-- table data: install\tipos_adjunto.tab
insert into "tipos_adjunto" ("tipo_adjunto", "descripcion") values
('SEC', 'Secreto Estadistico'),
('COM', 'Comodato'),
('DNI', 'Documento Nacional de Identidad'),
('MNA', 'Máximo Nivel Académico Alcanzado'),
('CV', 'Curriculum Vitae');

-- table data: install\tipos_adjunto_atributos.tab
insert into "tipos_adjunto_atributos" ("tipo_adjunto", "atributo", "orden", "columna") values
('SEC', 'fecha_firma', '1', '1'),
('COM', 'ficha_estante', '1', '1'),
('COM', 'responsable', '2', '2'),
('COM', 'bien', '3', '3'),
('COM', 'marca', '4', '4'),
('COM', 'serie', '5', '5'),
('COM', 'destinatario', '6', '6');
