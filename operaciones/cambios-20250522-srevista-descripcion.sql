-- ticket 168
SET search_path = siper; SET ROLE siper_owner;

----------------------------------------------------------------------------------------------
update "situacion_revista" set situacion_revista = 'AUTORIDADES SUPERIORES' where situacion_revista = 'AUTORIDADESSUPERIORES';
update "situacion_revista" set situacion_revista = 'CAT' where situacion_revista = 'CAT';
update "situacion_revista" set situacion_revista = 'CONTRATADO' where situacion_revista = 'CONTRATADO';
update "situacion_revista" set situacion_revista = 'CONTRATADO GCBA' where situacion_revista = 'CONTRATADOGCBA';
update "situacion_revista" set situacion_revista = 'CONTRATO DE OBRA' where situacion_revista = 'CONTRATODEOBRA';
update "situacion_revista" set situacion_revista = 'PLANTA GABINETE' where situacion_revista = 'PLANTAGABINETE';
update "situacion_revista" set situacion_revista = 'PLANTA PERMANENTE' where situacion_revista = 'PLANTAPERMANENTE';
update "situacion_revista" set situacion_revista = 'PLANTA TRANSITORIA' where situacion_revista = 'PLANTATRANSITORIA';

