SET search_path = siper; SET ROLE siper_owner;
-- Carga el rol configurador si no existe
insert into roles (rol, puede_cargar_todo, puede_cargar_dependientes, puede_cargar_propio, puede_corregir_el_pasado)
  select 'configurador', true, true ,true, true
    where not exists (select 1 from roles where rol = 'configurador');

/* creación de la tabla permisos_columnas
create table "permisos_columnas" (
  "pc_tabla" text, 
  "pc_columna" text, 
  "pc_configurable" boolean default 'true', 
  "pc_basico" text, 
  "pc_registra" text, 
  "pc_rrhh" text
, primary key ("pc_tabla", "pc_columna")
);
grant select, insert, update, delete on "permisos_columnas" to siper_admin;
grant all on "permisos_columnas" to siper_owner;

alter table "permisos_columnas" add constraint "pc_tabla<>''" check ("pc_tabla"<>'');
alter table "permisos_columnas" add constraint "pc_columna<>''" check ("pc_columna"<>'');
alter table "permisos_columnas" add constraint "pc_basico<>''" check ("pc_basico"<>'');
alter table "permisos_columnas" add constraint "pc_basico invalid option" check ("pc_basico" in ('ver','cambiar') );
alter table "permisos_columnas" add constraint "pc_registra<>''" check ("pc_registra"<>'');
alter table "permisos_columnas" add constraint "pc_registra invalid option" check ("pc_registra" in ('ver','cambiar') );
alter table "permisos_columnas" add constraint "pc_rrhh<>''" check ("pc_rrhh"<>'');
alter table "permisos_columnas" add constraint "pc_rrhh invalid option" check ("pc_rrhh" in ('ver','cambiar') );

ALTER TABLE "permisos_columnas" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp base" ON "permisos_columnas" AS PERMISSIVE FOR all TO siper_admin USING ( true );
CREATE POLICY "bp all" ON "permisos_columnas" AS RESTRICTIVE FOR all TO siper_admin USING ( (SELECT usuarios.rol = 'configurador' OR pc_configurable FROM usuarios INNER JOIN roles USING (rol) WHERE usuario = get_app_user()) );-- install/../node_modules/pg-triggers/lib/recreate-his.sql

select enance_table('permisos_columnas','pc_tabla,pc_columna');
-- Fin de la parte copiada de local-db-dump */ 

delete from permisos_columnas;

insert into permisos_columnas (pc_tabla, pc_columna , ficha_orden     , pc_configurable)
  select                     table_name, column_name, ordinal_position, column_name <> 'idper'
    from information_schema.columns
    where table_name = 'personas';
-- */    

select * 
  from permisos_columnas;