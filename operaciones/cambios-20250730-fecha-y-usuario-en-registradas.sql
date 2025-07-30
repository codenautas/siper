set search_path=siper;
--SET ROLE siper_muleto_owner;
SET ROLE siper_owner;

ALTER TABLE novedades_registradas ADD COLUMN fecha date NULL;
ALTER TABLE novedades_registradas ADD COLUMN usuario text NULL;