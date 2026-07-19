set search_path = siper, public;

create or replace view geo_domicilios as
  select d.idgeo, -- pk
        d.provincia,
        d.comuna_partido,
        d.barrio_localidad,
        d.calle,
        coalesce(d.nombre_calle, c.nombre_calle) as nombre_calle,
        d.altura,
        d.punto[0] as coordenada_x,
        d.punto[1] as coordenada_y,
        d.obs_geo,
        d.fecha_codificacion
    from per_domicilios d
      left join provincias p using (provincia)
      left join comunas_partidos co using (provincia, comuna_partido)
      left join barrios_localidades b using (provincia, comuna_partido, barrio_localidad)
      left join calles c using (provincia, calle)
    where d.idgeo is not null;

grant select, update on geo_domicilios to siper_admin;

CREATE OR REPLACE FUNCTION geo_domicilios_update() RETURNS trigger
  LANGUAGE plpgsql AS
$$
BEGIN
  UPDATE per_domicilios
    SET obs_geo = NEW.obs_geo,
        punto = point(NEW.coordenada_x, NEW.coordenada_y),
        fecha_codificacion = fecha_actual()
    WHERE idgeo = OLD.idgeo;
  RETURN NEW;
END;
$$;

CREATE TRIGGER geo_domicilios_update
  INSTEAD OF UPDATE ON geo_domicilios
  FOR EACH ROW
  EXECUTE FUNCTION geo_domicilios_update();
