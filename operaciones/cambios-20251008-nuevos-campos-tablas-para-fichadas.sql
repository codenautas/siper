set search_path = "siper";
-- AJUSTAR ADMIN Y OWNER SEGUN ENTORNO

--TABLAS
create table "cod_novedades" (
  "cod_nov" text, 
  "novedad" text, 
  "clase" text, 
  "c_dds" boolean, 
  "con_detalles" boolean, 
  "total" boolean, 
  "parcial" boolean, 
  "corridos" boolean, 
  "registra" boolean, 
  "prioritario" boolean, 
  "comun" boolean, 
  "pierde_presentismo" boolean, 
  "cuenta_horas" boolean, 
  "requiere_fichadas" boolean, 
  "requiere_entrada" boolean, 
  "umbral_posterior_entrada" integer, 
  "umbral_anterior_salida" integer, 
  "necesita_verificacion_manual" boolean, 
  "eximido_fichar" boolean
, primary key ("cod_nov")
);
grant select, insert, update, delete on "cod_novedades" to siper_admin;
grant all on "cod_novedades" to siper_owner;


create table "fichadas" (
  "idper" text, 
  "tipo_fichada" text, 
  "fecha" date, 
  "hora" time, 
  "observaciones" text, 
  "punto" text, 
  "tipo_dispositivo" text, 
  "id_original" text
, primary key ("idper", "fecha", "hora")
);
grant select on "fichadas" to siper_admin;
grant all on "fichadas" to siper_owner;


create table "bandas_horarias" (
  "banda_horaria" text, 
  "descripcion" text, 
  "hora_desde" time, 
  "hora_hasta" time, 
  "umbral_aviso_falta_entrada" integer, 
  "umbral_aviso_falta_salida" integer
, primary key ("banda_horaria")
);
grant select, insert, update, delete on "bandas_horarias" to siper_admin;
grant all on "bandas_horarias" to siper_owner;


-- CONSS

alter table "cod_novedades" add constraint "cod_nov<>''" check ("cod_nov"<>'');
alter table "cod_novedades" add constraint "novedad<>''" check ("novedad"<>'');
alter table "cod_novedades" add constraint "clase<>''" check ("clase"<>'');
alter table "cod_novedades" add unique ("cod_nov", "c_dds");
alter table "cod_novedades" add constraint "c_dds si o vacio" check (c_dds is not false);
alter table "cod_novedades" add constraint "solo digitos sin ceros a la izquierda en cod_nov" check (cod_nov similar to '[1-9][0-9]*|0');
alter table "fichadas" add constraint "idper<>''" check ("idper"<>'');
alter table "fichadas" add constraint "tipo_fichada<>''" check ("tipo_fichada"<>'');
alter table "fichadas" add constraint "observaciones<>''" check ("observaciones"<>'');
alter table "fichadas" add constraint "punto<>''" check ("punto"<>'');
alter table "fichadas" add constraint "tipo_dispositivo<>''" check ("tipo_dispositivo"<>'');
alter table "fichadas" add constraint "id_original<>''" check ("id_original"<>'');
alter table "bandas_horarias" add constraint "banda_horaria<>''" check ("banda_horaria"<>'');
alter table "bandas_horarias" add constraint "descripcion<>''" check ("descripcion"<>'');
alter table "bandas_horarias" alter column "hora_desde" set not null;
alter table "bandas_horarias" alter column "hora_hasta" set not null;
alter table "bandas_horarias" add constraint "palabra corta y solo mayusculas en banda_horaria" check (banda_horaria similar to '[A-Z][A-Z0-9]{0,9}|[1-9]\d{0,10}');
alter table "bandas_horarias" add constraint "Solo mayusculas en banda_horaria" check (banda_horaria similar to '[A-Z][A-Z0-9 ]*');


--FKs
alter table "cod_novedades" add constraint "cod_novedades clases REL" foreign key ("clase") references "clases" ("clase")  on update cascade;
alter table "fichadas" add constraint "fichadas personas REL" foreign key ("idper") references "personas" ("idper")  on update cascade;
alter table "fichadas" add constraint "fichadas fechas REL" foreign key ("fecha") references "fechas" ("fecha")  on update cascade;


--INDEX
create index "clase 4 cod_novedades IDX" ON "cod_novedades" ("clase");
create index "banda_horaria 4 personas IDX" ON "personas" ("banda_horaria");
create index "idper 4 fichadas IDX" ON "fichadas" ("idper");
create index "fecha 4 fichadas IDX" ON "fichadas" ("fecha");

--ADAPT
do $SQL_ENANCE$
 begin
PERFORM enance_table('cod_novedades','cod_nov');
PERFORM enance_table('fichadas','idper,fecha,hora');
PERFORM enance_table('bandas_horarias','banda_horaria');
end
$SQL_ENANCE$;