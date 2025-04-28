SET search_path = siper;

ALTER TABLE personas DROP COLUMN domicilio;

update per_domicilios set tipo_domicilio = null where domicilio = 1 and tipo_domicilio = 'A';

delete from per_domicilios where tipo_domicilio = 'A';

delete from tipos_domicilio where tipo_domicilio = 'A'; 

update per_domicilios set tipo_domicilio = 'T' WHERE tipo_domicilio is null and domicilio = 1;
