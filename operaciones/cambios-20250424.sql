SET search_path = siper;

ALTER TABLE tipos_domicilio ADD COLUMN visible boolean;

ALTER TABLE personas DROP COLUMN domicilio;

update per_domicilios set tipo_domicilio = 'T' WHERE tipo_domicilio is null and domicilio = 1;
