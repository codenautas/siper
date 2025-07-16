set search_path = siper;
SET ROLE siper_muleto_owner;

alter table personas add column banda_horaria text;

create table "bandas_horarias" (
  "banda_horaria" text, 
  "descripcion" text, 
  "hora_desde" time, 
  "hora_hasta" time
, primary key ("banda_horaria")
);
grant select, insert, update, delete on "bandas_horarias" to siper_admin;
grant all on "bandas_horarias" to siper_owner;

alter table "personas" add constraint "banda_horaria<>''" check ("banda_horaria"<>'');

-- table data: ..\siper-data\version1.1\bandas_horarias.tab
insert into "bandas_horarias" ("banda_horaria", "descripcion", "hora_desde", "hora_hasta") values
('CAMPO', 'Lunes a Domingo de 8 a 22', '08:00', '22:00'),
('GABINETE', 'Lunes a Viernes 8 a 20', '08:00', '20:00');

alter table annios drop CONSTRAINT "annio abierto completo";
update annios set horario_habitual_desde = null, horario_habitual_hasta = null;

alter table "bandas_horarias" add constraint "banda_horaria<>''" check ("banda_horaria"<>'');
alter table "bandas_horarias" add constraint "descripcion<>''" check ("descripcion"<>'');
alter table "bandas_horarias" alter column "hora_desde" set not null;
alter table "bandas_horarias" alter column "hora_hasta" set not null;
alter table "bandas_horarias" add constraint "palabra corta y solo mayusculas en banda_horaria" check (banda_horaria similar to '[A-Z][A-Z0-9]{0,9}|[1-9]\d{0,10}');
alter table "bandas_horarias" add constraint "Solo mayusculas en banda_horaria" check (banda_horaria similar to '[A-Z][A-Z0-9 ]*');

alter table "personas" add constraint "personas bandas_horarias REL" foreign key ("banda_horaria") references "bandas_horarias" ("banda_horaria")  on update cascade;


do $SQL_ENANCE$
 begin
 PERFORM enance_table('bandas_horarias','banda_horaria');
 end
$SQL_ENANCE$;

create index "banda_horaria 4 personas IDX" ON "personas" ("banda_horaria");
