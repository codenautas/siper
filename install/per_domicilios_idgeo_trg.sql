/* PARA CORRERLO VARIAS VECES. No COMMITEAR descomentado
  set role to siper_owner;
  set search_path = siper;
  DROP TRIGGER IF EXISTS per_domicilios_idgeo_trg ON per_domicilios;
  DROP FUNCTION IF EXISTS per_domicilios_idgeo_trg();
-- */

CREATE OR REPLACE FUNCTION per_domicilios_idgeo_trg()
    RETURNS trigger
    LANGUAGE plpgsql
AS $BODY$
BEGIN
    IF TG_OP = 'INSERT' THEN
        new.idgeo := nextval('per_domicilios_idgeo_seq');
    ELSIF TG_OP = 'UPDATE' THEN
        IF (new.nombre_calle     IS DISTINCT FROM old.nombre_calle
         OR new.calle            IS DISTINCT FROM old.calle
         OR new.barrio_localidad IS DISTINCT FROM old.barrio_localidad
         OR new.altura           IS DISTINCT FROM old.altura
         OR new.comuna_partido   IS DISTINCT FROM old.comuna_partido
         OR new.provincia        IS DISTINCT FROM old.provincia) THEN
            new.idgeo              := nextval('per_domicilios_idgeo_seq');
            new.punto              := null;
            new.obs_geo            := null;
            new.fecha_codificacion := null;
        ELSIF (new.punto::text IS DISTINCT FROM old.punto::text -- point no tiene operador =
            OR new.obs_geo     IS DISTINCT FROM old.obs_geo) THEN
            new.fecha_codificacion := fecha_actual();
        END IF;
    END IF;
    RETURN new;
END;
$BODY$;

CREATE TRIGGER per_domicilios_idgeo_trg
    BEFORE INSERT OR UPDATE
    ON per_domicilios
    FOR EACH ROW
    EXECUTE PROCEDURE per_domicilios_idgeo_trg();
