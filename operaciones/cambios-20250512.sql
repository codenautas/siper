-- ticket 141
set search_path=siper;
SET ROLE siper_owner;

ALTER TABLE siper.sectores
ADD COLUMN activo boolean default 'true';