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
