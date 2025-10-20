set search_path = siper;
set role siper_muleto_owner;

alter table  personas add column "max_nivel_ed" integer; 


create table "niveles_educativos" (
  "nivel_educativo" integer, 
  "nombre" text
, primary key ("nivel_educativo")
);
grant select, insert, update, delete on "niveles_educativos" to siper_muleto_admin;
grant all on "niveles_educativos" to siper_muleto_owner;


-- table data: ..\siper-data\version4\niveles_educativos.tab
insert into "niveles_educativos" ("nivel_educativo", "nombre") values
('1', 'PRIMARIA COMPLETA'),
('2', 'SECUNDARIA COMPLETA'),
('3', 'TERCIARIO COMPLETO'),
('4', 'UNIVERSITARIO COMPLETO'),
('5', 'POSTGRADO COMPLETO');
             

alter table "niveles_educativos" add constraint "nombre<>''" check ("nombre"<>'');

alter table "personas" add constraint "personas niveles_educativos REL" foreign key ("max_nivel_ed") references "niveles_educativos" ("nivel_educativo")  on update cascade;

create index "max_nivel_ed 4 personas IDX" ON "personas" ("max_nivel_ed");

PERFORM enance_table('niveles_educativos','nivel_educativo');
