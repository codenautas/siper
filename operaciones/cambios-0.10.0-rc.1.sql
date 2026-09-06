-- Cambios para la versión 0.10.0-rc.1: 
set role to siper_muleto_owner;
set search_path = siper;

alter table reglas add column incidencias_por_hora text not null default '60,77';


CREATE OR REPLACE FUNCTION procesar_fichada_recibida_trg() RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    set search_path=siper
AS
$$
DECLARE
    v_idper text;
    v_tipo_mapeado text;
    v_hora_redondeada time;
BEGIN
    BEGIN
        SELECT idper INTO v_idper
        FROM usuarios
        WHERE usuario = NEW.fichador;

        IF v_idper IS NULL THEN
            RAISE EXCEPTION 'Usuario "%" no encontrado en la tabla usuarios', NEW.fichador;
        END IF;

        v_tipo_mapeado := CASE
            WHEN lower(NEW.tipo) IN ('e', 'entrada') THEN 'E'
            WHEN lower(NEW.tipo) IN ('s', 'salida' ) THEN 'S'
            ELSE 'O'
        END CASE;

        v_hora_redondeada := new.hora;        
        /*
        v_hora_redondeada := date_trunc('minute',
            new.hora + CASE v_tipo_mapeado WHEN 'E' THEN '0'::interval WHEN 'S' THEN '59 seconds'::interval ELSE '30 seconds'::interval END
        );
        */

        MERGE INTO fichadas AS f
            USING (
                SELECT
                    v_idper AS idper,
                    NEW.fecha AS fecha,
                    v_hora_redondeada AS hora,
                    v_tipo_mapeado AS tipo_fichada,
                    NEW.texto AS observaciones,
                    textolatlong_gps_a_punto(NEW.punto_gps) AS punto,
                    NEW.dispositivo AS tipo_dispositivo
            ) AS s ON f.idper = s.idper AND f.fecha = s.fecha AND f.hora = s.hora AND f.tipo_fichada = s.tipo_fichada
            WHEN MATCHED AND (f.observaciones IS NULL AND s.observaciones IS NOT NULL OR f.punto IS NULL AND s.punto IS NOT NULL) 
            THEN UPDATE SET
                observaciones = COALESCE(f.observaciones, s.observaciones),
                punto = COALESCE(f.punto, s.punto)
            WHEN NOT MATCHED THEN INSERT (
                idper, fecha, hora, tipo_fichada,
                observaciones, punto, tipo_dispositivo
            ) VALUES (
                s.idper, s.fecha, s.hora, s.tipo_fichada,
                s.observaciones, s.punto, s.tipo_dispositivo
            );
        NEW.migrado_estado := 'OK';
        NEW.migrado_log := null;
    EXCEPTION WHEN OTHERS THEN
        NEW.migrado_estado := 'ERROR';
        NEW.migrado_log := SQLERRM;
    END;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION siper.multirango_fichadas(p_idper text, p_fecha date) 
  RETURNS time_multirange 
  STABLE LANGUAGE SQL
AS
$sql$
  WITH eventos_raw(hora, tipo_fichada) AS (
    SELECT hora, tipo_fichada,
        ROW_NUMBER() OVER (ORDER BY hora, tipo_fichada desc) AS orden,
        COUNT(*) OVER () AS cantidad,
        hora - MIN(hora) OVER () AS elapsed
      FROM fichadas f 
      WHERE f.fecha = p_fecha AND f.idper = p_idper AND tipo_fichada in ('E', 'S')
  ),
  eventos_imp AS (
    SELECT
      hora,
      -- CASE
      --  WHEN cantidad > 1 AND orden = 1        AND tipo_fichada = 'S' THEN 'E'
      --  WHEN cantidad > 1 AND orden = cantidad AND tipo_fichada = 'E' AND elapsed >= '5 hours'::interval THEN 'S'
      --  ELSE tipo_fichada
      -- END AS 
      tipo_fichada
    FROM eventos_raw
  ),
  primeros AS (
    SELECT hora, tipo_fichada
    FROM (
        SELECT hora, tipo_fichada, LAG(tipo_fichada) OVER (ORDER BY hora, tipo_fichada desc) AS tipo_anterior
        FROM eventos_imp
    ) t
    WHERE tipo_fichada IS DISTINCT FROM tipo_anterior
  ),
  eventos AS (
    SELECT
      hora,
      tipo_fichada,
      SUM(CASE WHEN tipo_fichada = 'E' THEN 1 ELSE 0 END) OVER (ORDER BY hora, tipo_fichada desc ROWS UNBOUNDED PRECEDING) AS grupo
    FROM primeros
  ),
  rangos AS (
    SELECT
      grupo,
      MIN(CASE WHEN tipo_fichada = 'E' THEN greatest(bh.hora_desde, least(bh.hora_hasta, hora)) END) AS entrada,
      MAX(CASE WHEN tipo_fichada = 'S' THEN greatest(bh.hora_desde, least(bh.hora_hasta, hora)) END) AS salida
    FROM eventos,
        personas p INNER JOIN bandas_horarias bh USING (banda_horaria)
      WHERE p.idper = p_idper
    GROUP BY grupo, bh.hora_desde, bh.hora_hasta
  )
  SELECT coalesce(range_agg(time_range(entrada, salida,'()')), time_multirange()) AS presencia
    FROM rangos;
$sql$;


DROP TRIGGER IF EXISTS procesar_fichada_recibida_trg ON fichadas_recibidas;
CREATE TRIGGER procesar_fichada_recibida_trg
    BEFORE INSERT OR UPDATE ON fichadas_recibidas
    FOR EACH ROW
    EXECUTE PROCEDURE procesar_fichada_recibida_trg();
