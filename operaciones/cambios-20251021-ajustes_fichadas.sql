SET ROLE siper_owner;
set search_path = siper;

create table "tipos_fichada" (
  "tipo_fichada" text, 
  "nombre" text, 
  "orden" integer
, primary key ("tipo_fichada")
);
grant select, insert, update, delete on "tipos_fichada" to siper_admin;
grant all on "tipos_fichada" to siper_owner;

alter table "tipos_fichada" add constraint "tipo_fichada<>''" check ("tipo_fichada"<>'');
alter table "tipos_fichada" add constraint "nombre<>''" check ("nombre"<>'');
alter table "tipos_fichada" alter column "nombre" set not null;
alter table "tipos_fichada" alter column "orden" set not null;


insert into "tipos_fichada" ("tipo_fichada", "nombre") values
('E', 'ENTRADA', 10),
('S', 'SALIDA', 20),
('O', 'OTROS' 30);

update fichadas set tipo_fichada = 'O';

alter table "fichadas" alter column "tipo_fichada" set not null;

alter table "fichadas" add constraint "fichadas tipos_fichada REL" foreign key ("tipo_fichada") references "tipos_fichada" ("tipo_fichada")  on update cascade;
create index "tipo_fichada 4 fichadas IDX" ON "fichadas" ("tipo_fichada");