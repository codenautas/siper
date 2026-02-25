set search_path=siper;
SET ROLE siper_muleto_owner;
--SET ROLE siper_owner;

ALTER TABLE "fechas" 
ADD COLUMN "fichadas_consolidadas" boolean DEFAULT false;


create table "fichadas_vigentes" (
  "idper" text, 
  "fecha" date, 
  "annio" integer generated always as (extract(year from fecha)) stored, 
  "cod_nov" text, 
  "fichadas" time_range default '(,)', 
  "horario_entrada" time, 
  "horario_salida" time
, primary key ("idper", "fecha")
);
grant select on "fichadas_vigentes" to siper_admin;
grant all on "fichadas_vigentes" to siper_owner;


alter table "fichadas_vigentes" add constraint "idper<>''" check ("idper"<>'');
alter table "fichadas_vigentes" add constraint "cod_nov<>''" check ("cod_nov"<>'');
alter table "fichadas_vigentes" alter column "fichadas" set not null;

alter table "fichadas_vigentes" add constraint "fichadas_vigentes personas REL" foreign key ("idper") references "personas" ("idper")  on update cascade;
alter table "fichadas_vigentes" add constraint "fichadas_vigentes cod_novedades REL" foreign key ("cod_nov") references "cod_novedades" ("cod_nov")  on update cascade;

create index "idper 4 fichadas_vigentes IDX" ON "fichadas_vigentes" ("idper");
create index "cod_nov 4 fichadas_vigentes IDX" ON "fichadas_vigentes" ("cod_nov");