-- Agrega las políticas de seguridad a per_domicilios y per_telefonos: solo se ven los datos de las personas que se pueden ver
set role to siper_muleto_owner;
set search_path = siper;

-- Una salida antes de la primera entrada no se tiene en cuenta (se conserva en el multirango para mostrarla)
CREATE OR REPLACE FUNCTION siper.fichadas_sin_salida_inicial(p_fichadas time_multirange)
  RETURNS time_multirange
  IMMUTABLE LANGUAGE SQL
AS
$sql$
  SELECT CASE WHEN cardinality(p_fichadas) > 1 AND lower_inf(p_fichadas)
      THEN (SELECT range_agg(r) FROM unnest(p_fichadas) WITH ORDINALITY AS t(r, ord) WHERE ord > 1)
      ELSE p_fichadas
    END;
$sql$;

CREATE OR REPLACE FUNCTION fichadas_vigentes_cod_nov_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE plpgsql
AS
$BODY$
DECLARE
  v_annio integer := EXTRACT(YEAR FROM new.fecha);
  v_annio_abierto boolean;
  v_regla RECORD;
  v_fichadas time_multirange;
BEGIN
  SELECT a.abierto
    INTO v_annio_abierto
    FROM annios a
   WHERE a.annio = v_annio;
  IF v_annio_abierto THEN
    SELECT *
      INTO v_regla
      FROM reglas
      WHERE annio = v_annio;
    v_fichadas := fichadas_sin_salida_inicial(new.fichadas);
    IF cardinality(v_fichadas) <= 1 AND lower(v_fichadas) IS NULL AND upper(v_fichadas) IS NULL THEN
      NEW.cod_nov := v_regla.codnov_sin_fichadas;
    ELSIF cardinality(v_fichadas) <= 1 AND (lower(v_fichadas) IS NULL OR upper(v_fichadas) IS NULL) THEN
      NEW.cod_nov := v_regla.codnov_unica_fichada;
    ELSE
      NEW.cod_nov := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$BODY$;

-- fichadas_vigentes: los cambios en personas, annios y fechas no tocan los días con fichadas consolidadas;
-- los cambios en fichadas (incluido el borrado y el cambio de idper o fecha) recalculan su día salvo que el año esté cerrado
CREATE OR REPLACE FUNCTION personas_fichadas_vigentes_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  IF new.activo THEN
    INSERT INTO fichadas_vigentes (idper, fecha)
      SELECT new.idper, fecha
        FROM fechas f
          INNER JOIN annios a USING (annio)
        WHERE a.abierto
      ON CONFLICT DO NOTHING;
    UPDATE fichadas_vigentes fv
      SET fichadas = multirango_fichadas(fv.idper, fv.fecha)
      FROM annios a, fechas f
      WHERE fv.idper = new.idper
        AND fv.annio = a.annio
        AND a.abierto
        AND fv.fecha = f.fecha
        AND f.fichadas_consolidadas IS NOT TRUE;
  END IF;
  RETURN NEW;
END;
$BODY$;

CREATE OR REPLACE FUNCTION annios_fichadas_vigentes_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  IF new.abierto THEN
    INSERT INTO fichadas_vigentes (idper, fecha)
      SELECT idper, fecha
        FROM fechas f, personas p
        WHERE f.annio = new.annio
          AND p.activo
      ON CONFLICT DO NOTHING;
    UPDATE fichadas_vigentes fv
      SET fichadas = multirango_fichadas(fv.idper, fv.fecha)
      FROM personas p, fechas f
      WHERE fv.annio = new.annio
        AND fv.idper = p.idper
        AND p.activo
        AND fv.fecha = f.fecha
        AND f.fichadas_consolidadas IS NOT TRUE;
  END IF;
  RETURN NEW;
END;
$BODY$;

CREATE OR REPLACE FUNCTION fechas_fichadas_vigentes_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  IF new.annio IS NOT NULL THEN
    INSERT INTO fichadas_vigentes (idper, fecha)
      SELECT idper, new.fecha
        FROM personas p
        WHERE p.activo
      ON CONFLICT DO NOTHING;
  END IF;
  IF new.annio IS NOT NULL AND new.fichadas_consolidadas IS NOT TRUE THEN
    UPDATE fichadas_vigentes fv
      SET fichadas = multirango_fichadas(fv.idper, fv.fecha)
      FROM personas p, annios a
      WHERE fv.fecha = new.fecha
        AND fv.annio = a.annio
        AND fv.idper = p.idper
        AND a.abierto
        AND p.activo;
  END IF;
  RETURN NEW;
END;
$BODY$;

-- Recalcula las fichadas vigentes de una persona en un día (aunque el día esté consolidado), salvo que el año esté cerrado
CREATE OR REPLACE PROCEDURE fichadas_vigentes_recalcular_dia(p_idper text, p_fecha date)
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM fechas f
        INNER JOIN annios a USING (annio)
      WHERE f.fecha = p_fecha
        AND a.abierto
  ) THEN
    INSERT INTO fichadas_vigentes (idper, fecha)
      VALUES (p_idper, p_fecha)
      ON CONFLICT DO NOTHING;
    UPDATE fichadas_vigentes
      SET fichadas = multirango_fichadas(idper, fecha)
      WHERE idper = p_idper
        AND fecha = p_fecha;
  END IF;
END;
$BODY$;

CREATE OR REPLACE FUNCTION fichadas_fichadas_vigentes_trg()
  RETURNS TRIGGER
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
  IF tg_op = 'DELETE' OR tg_op = 'UPDATE' AND (old.idper, old.fecha) IS DISTINCT FROM (new.idper, new.fecha) THEN
    CALL fichadas_vigentes_recalcular_dia(old.idper, old.fecha);
  END IF;
  IF tg_op <> 'DELETE' THEN
    CALL fichadas_vigentes_recalcular_dia(new.idper, new.fecha);
  END IF;
  IF tg_op = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$BODY$;

DROP TRIGGER IF EXISTS fichadas_fichadas_vigentes_trg ON fichadas;
CREATE TRIGGER fichadas_fichadas_vigentes_trg 
  AFTER INSERT OR UPDATE OR DELETE
  ON fichadas 
  FOR EACH ROW 
  EXECUTE PROCEDURE fichadas_fichadas_vigentes_trg();
