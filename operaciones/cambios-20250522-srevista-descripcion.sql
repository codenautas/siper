-- ticket 168
SET search_path = siper; SET ROLE siper_owner;

ALTER TABLE "situacion_revista"
ADD COLUMN descripcion text NULL;

alter table "situacion_revista" add constraint "descripcion<>''" check ("descripcion"<>'');


----------------------------------------------------------------------------------------------
update "situacion_revista" set descripcion = 'AUTORIDADES SUPERIORES' where situacion_revista = 'AUTORIDADESSUPERIORES';
update "situacion_revista" set descripcion = 'CAT' where situacion_revista = 'CAT';
update "situacion_revista" set descripcion = 'CONTRATADO' where situacion_revista = 'CONTRATADO';
update "situacion_revista" set descripcion = 'CONTRATADO GCBA' where situacion_revista = 'CONTRATADOGCBA';
update "situacion_revista" set descripcion = 'CONTRATO DE OBRA' where situacion_revista = 'CONTRATODEOBRA';
update "situacion_revista" set descripcion = 'PLANTA GABINETE' where situacion_revista = 'PLANTAGABINETE';
update "situacion_revista" set descripcion = 'PLANTA PERMANENTE' where situacion_revista = 'PLANTAPERMANENTE';
update "situacion_revista" set descripcion = 'PLANTA TRANSITORIA' where situacion_revista = 'PLANTATRANSITORIA';

