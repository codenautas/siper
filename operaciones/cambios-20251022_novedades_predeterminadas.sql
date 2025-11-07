set search_path = siper;
set role siper_muleto_owner;

alter table novedades_registradas add column "tipo_novedad" text; 

create table "tipos_novedad" (
  "tipo_novedad" text, 
  "descripcion" text, 
  "orden" integer
, primary key ("tipo_novedad")
);
grant select, insert, update, delete on "tipos_novedad" to siper_muleto_admin;
grant all on "tipos_novedad" to siper_muleto_owner;

-- table data: install\tipos_novedad.tab
insert into "tipos_novedad" ("tipo_novedad", "descripcion", "orden") values
('V', 'Válida', '0'),
('B', 'Base', '1');

alter table "tipos_novedad" add constraint "tipo_novedad<>''" check ("tipo_novedad"<>'');
alter table "tipos_novedad" add constraint "descripcion<>''" check ("descripcion"<>'');
alter table "tipos_novedad" add constraint "palabra corta y solo mayusculas en tipo_novedad" check (tipo_novedad similar to '[A-Z][A-Z0-9]{0,9}|[1-9]\d{0,10}');
alter table "tipos_novedad" add constraint "orden de tipo de novedades" unique ("orden", "tipo_novedad");

alter table "novedades_registradas" add constraint "tipo_novedad<>''" check ("tipo_novedad"<>'');
alter table "novedades_registradas" add constraint "novedades_registradas tipos_novedad REL" foreign key ("tipo_novedad") references "tipos_novedad" ("tipo_novedad")  on update cascade;

create index "tipo_novedad 4 novedades_registradas IDX" ON "novedades_registradas" ("tipo_novedad");

do $SQL_ENANCE$
 begin
  PERFORM enance_table('tipos_novedad','tipo_novedad');
 end
$SQL_ENANCE$;



