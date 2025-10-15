set search_path = siper;

-- ===== tablas =====
ALTER TABLE fichadas ADD COLUMN annio            integer;
ALTER TABLE fichadas ADD COLUMN id_fichada       bigint;
ALTER TABLE fichadas ADD COLUMN tipo_fichada     text;
ALTER TABLE fichadas ADD COLUMN observaciones    text;
ALTER TABLE fichadas ADD COLUMN punto            text;
ALTER TABLE fichadas ADD COLUMN tipo_dispositivo text;
ALTER TABLE fichadas ADD COLUMN id_original      text;
ALTER TABLE fichadas DROP COLUMN origen;


ALTER TABLE cod_novedades ADD COLUMN pierde_presentismo boolean;
ALTER TABLE cod_novedades ADD COLUMN cuenta_horas boolean;
ALTER TABLE cod_novedades ADD COLUMN requiere_fichadas boolean;
ALTER TABLE cod_novedades ADD COLUMN requiere_entrada boolean;
ALTER TABLE cod_novedades ADD COLUMN umbral_posterior_entrada integer;
ALTER TABLE cod_novedades ADD COLUMN umbral_anterior_salida integer;
ALTER TABLE cod_novedades ADD COLUMN necesita_verificacion_manual boolean;
ALTER TABLE cod_novedades ADD COLUMN eximido_fichar boolean;

ALTER TABLE bandas_horarias ADD COLUMN umbral_aviso_falta_entrada integer;
ALTER TABLE bandas_horarias ADD COLUMN umbral_aviso_falta_salida integer;

-- ===== sequence id_fichada (arranca en 101) =====
CREATE SEQUENCE "id_fichada_seq" START 101;
ALTER TABLE "fichadas" ALTER COLUMN "id_fichada" SET DEFAULT nextval('id_fichada_seq'::regclass);
GRANT USAGE, SELECT ON SEQUENCE "id_fichada_seq" TO siper_admin;

-- completar filas existentes y restringir
UPDATE fichadas SET id_fichada = DEFAULT WHERE id_fichada IS NULL;
ALTER TABLE fichadas ALTER COLUMN id_fichada SET NOT NULL;

-- ===== agregar id_fichada a pk =====
ALTER TABLE fichadas DROP CONSTRAINT fichadas_pkey;
ALTER TABLE fichadas ADD CONSTRAINT fichadas_pkey PRIMARY KEY (idper, fecha, hora, id_fichada );

-- ===== CONS =====
alter table "fichadas" add constraint "tipo_fichada<>''" check ("tipo_fichada"<>'');
alter table "fichadas" add constraint "observaciones<>''" check ("observaciones"<>'');
alter table "fichadas" add constraint "punto<>''" check ("punto"<>'');
alter table "fichadas" add constraint "tipo_dispositivo<>''" check ("tipo_dispositivo"<>'');
alter table "fichadas" add constraint "id_original<>''" check ("id_original"<>'');

-- ===== Nuevas tablas =====
create table "reglas" (
  "annio" integer, 
  "codnov_unica_fichada" text, 
  "codnov_sin_fichadas" text, 
  "umbral_horas_mensuales" integer, 
  "umbral_horas_diarias" integer, 
  "umbral_horas_semanales" integer, 
  "umbral_horas_personales" integer, 
  "horario_consolidado" time, 
  "minimas_horas_diarias_declaradas" integer, 
  "maximas_horas_diarias_declaradas" integer
, primary key ("annio")
);
grant select on "reglas" to siper_admin;
grant all on "reglas" to siper_owner;


create table "avisos_falta_fichada" (
  "idper" text, 
  "fecha" date, 
  "tipo_fichada" text, 
  "avisado_wp" time, 
  "avisado_mail" time, 
  "llegada_novedad" time
, primary key ("idper")
);
grant select on "avisos_falta_fichada" to siper_admin;
grant all on "avisos_falta_fichada" to siper_owner;


alter table "reglas" add constraint "codnov_unica_fichada<>''" check ("codnov_unica_fichada"<>'');
alter table "reglas" add constraint "codnov_sin_fichadas<>''" check ("codnov_sin_fichadas"<>'');
alter table "avisos_falta_fichada" add constraint "idper<>''" check ("idper"<>'');
alter table "avisos_falta_fichada" add constraint "tipo_fichada<>''" check ("tipo_fichada"<>'');


alter table "avisos_falta_fichada" add constraint "avisos_falta_fichada personas REL" foreign key ("idper") references "personas" ("idper")  on update cascade;


create index "idper 4 avisos_falta_fichada IDX" ON "avisos_falta_fichada" ("idper");


do $SQL_ENANCE$
 begin
PERFORM enance_table('reglas','annio');
PERFORM enance_table('avisos_falta_fichada','idper');
end
$SQL_ENANCE$;