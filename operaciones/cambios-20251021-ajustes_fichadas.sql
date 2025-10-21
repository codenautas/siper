SET ROLE siper_owner;
set search_path = siper;

create table "tipos_fichada" (
  "tipo_fichada" text, 
  "nombre" text
, primary key ("tipo_fichada")
);
grant select, insert, update, delete on "tipos_fichada" to siper_admin;
grant all on "tipos_fichada" to siper_owner;

alter table "tipos_fichada" add constraint "tipo_fichada<>''" check ("tipo_fichada"<>'');
alter table "tipos_fichada" add constraint "nombre<>''" check ("nombre"<>'');
alter table "tipos_fichada" alter column "nombre" set not null;

insert into "tipos_fichada" ("tipo_fichada", "nombre") values
('E', 'ENTRADA'),
('S', 'SALIDA'),
('O', 'OTROS');

update fichadas set tipo_fichada = 'O';

alter table "fichadas" alter column "tipo_fichada" set not null;

alter table "fichadas" add constraint "fichadas tipos_fichada REL" foreign key ("tipo_fichada") references "tipos_fichada" ("tipo_fichada")  on update cascade;
create index "tipo_fichada 4 fichadas IDX" ON "fichadas" ("tipo_fichada");