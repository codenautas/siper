-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;
CREATE OR REPLACE FUNCTION horarios_novedades_trg()
  RETURNS TRIGGER
  LANGUAGE PLPGSQL
AS
$BODY$
DECLARE
  vdesdeanterior date;
  vhastaanterior date;

BEGIN
IF tg_op = 'INSERT' THEN
  --Busco registro anterior en el orden de PK
  SELECT MAX(desde) INTO vdesdeanterior
    FROM horarios
    WHERE idper = NEW.idper AND dds = NEW.dds AND annio = EXTRACT(year FROM NEW.desde) AND desde < NEW.desde
    GROUP BY idper, dds, annio; --registro anterior

  SELECT hasta INTO vhastaanterior
    FROM horarios
    WHERE idper = NEW.idper and dds = NEW.dds and annio = EXTRACT(year FROM NEW.desde) and desde = vdesdeanterior;
    
  NEW.hasta := vhastaanterior;

  UPDATE horarios SET hasta = NEW.desde - 1 
  WHERE idper = NEW.idper and dds = NEW.dds and annio = EXTRACT(year FROM NEW.desde) and desde = vdesdeanterior;
  
  RETURN NEW;
END IF;
----------------------------------------------------
IF tg_op = 'DELETE' THEN
  --Busco registro anterior en el orden de PK
  SELECT MAX(desde) INTO vdesdeanterior
    FROM horarios
    WHERE idper = OLD.idper AND dds = OLD.dds AND annio = EXTRACT(year FROM OLD.desde) AND desde < OLD.desde
    GROUP BY idper, dds, annio; --registro anterior

  UPDATE horarios SET hasta = OLD.hasta 
  WHERE idper = OLD.idper and dds = OLD.dds and annio = EXTRACT(year FROM OLD.desde) and desde = vdesdeanterior;

  RETURN OLD;
END IF;
----------------------------------------------------
IF tg_op = 'UPDATE' THEN
  RETURN NEW;
END IF;
----------------------------------------------------
END;
$BODY$;

DROP TRIGGER IF EXISTS horarios_novedades_trg on horarios;
CREATE TRIGGER horarios_novedades_trg
  BEFORE INSERT OR DELETE --OR UPDATE desde
  ON horarios
  FOR EACH ROW
  EXECUTE PROCEDURE horarios_novedades_trg();
