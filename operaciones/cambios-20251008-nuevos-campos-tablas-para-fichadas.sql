set search_path = "siper";
-- AJUSTAR ADMIN Y OWNER SEGUN ENTORNO

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


CREATE SEQUENCE "id_fichada_seq" START 101;
ALTER TABLE "fichadas" ALTER COLUMN "id_fichada" SET DEFAULT nextval('id_fichada_seq'::regclass);
GRANT USAGE, SELECT ON SEQUENCE "id_fichada_seq" TO siper_admin;