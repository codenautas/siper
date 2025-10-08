set search_path = "siper";
-- AJUSTAR ADMIN Y OWNER SEGUN ENTORNO

ALTER TABLE fichadas ADD COLUMN tipo_fichada     text NULL;
ALTER TABLE fichadas ADD COLUMN observaciones    text NULL;
ALTER TABLE fichadas ADD COLUMN punto            text NULL;
ALTER TABLE fichadas ADD COLUMN tipo_dispositivo text NULL;
ALTER TABLE fichadas ADD COLUMN id_original      text NULL;
ALTER TABLE fichadas DROP COLUMN origen;

ALTER TABLE cod_novedades ADD COLUMN pierde_presentismo boolean Null;
ALTER TABLE cod_novedades ADD COLUMN cuenta_horas boolean NULL;
ALTER TABLE cod_novedades ADD COLUMN requiere_fichadas boolean NULL;
ALTER TABLE cod_novedades ADD COLUMN requiere_entrada boolean NULL;
ALTER TABLE cod_novedades ADD COLUMN umbral_posterior_entrada integer NULL;
ALTER TABLE cod_novedades ADD COLUMN umbral_anterior_salida integer NULL;
ALTER TABLE cod_novedades ADD COLUMN necesita_verificacion_manual boolean NULL;
ALTER TABLE cod_novedades ADD COLUMN eximido_fichar boolean NULL;

ALTER TABLE bandas_horarias ADD COLUMN umbral_aviso_falta_entrada integer NULL;
ALTER TABLE bandas_horarias ADD COLUMN umbral_aviso_falta_salida integer NULL;    