set search_path = siper;
set role siper_muleto_owner;

DO $$
BEGIN
    -- Borra la constraint si existe
    ALTER TABLE "novedades_registradas" DROP CONSTRAINT IF EXISTS "desde y hasta deben ser del mismo annio";

    -- Agrega la constraint
    ALTER TABLE "novedades_registradas" ADD CONSTRAINT "desde y hasta deben ser del mismo annio" CHECK (extract(year from desde) is not distinct from extract(year from hasta));
END $$;