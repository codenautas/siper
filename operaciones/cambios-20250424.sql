SET search_path = siper;

ALTER TABLE tipos_domicilio ADD COLUMN visible boolean;

ALTER TABLE personas DROP COLUMN domicilio;
