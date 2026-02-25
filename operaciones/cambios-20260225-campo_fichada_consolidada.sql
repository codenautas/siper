set search_path=siper;
SET ROLE siper_muleto_owner;
--SET ROLE siper_owner;

ALTER TABLE "fechas" 
ADD COLUMN "fichadas_consolidadas" boolean DEFAULT false;