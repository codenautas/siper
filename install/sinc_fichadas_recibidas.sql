set search_path = siper;

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

DROP TRIGGER IF EXISTS procesar_fichada_recibida_trg ON fichadas_recibidas;
CREATE TRIGGER procesar_fichada_recibida_trg
    BEFORE INSERT OR UPDATE ON fichadas_recibidas
    FOR EACH ROW
    EXECUTE PROCEDURE procesar_fichada_recibida_trg();

/*

-- CREATE INDEX IF NOT EXISTS "pseudo pk fichadas IDX" ON siper.fichadas (idper, fecha, hora, tipo_fichada);
-- delete from fichadas;
alter table fichadas disable trigger user;
update fichadas_recibidas set dispositivo = dispositivo;
select count(*) from fichadas;
-- select count(*) from fichadas_recibidas;

alter table fichadas enable trigger user;

alter table fichadas_vigentes disable trigger fichadas_vigentes_a_novedades_trg;
update fichadas set observaciones = observaciones;
alter table fichadas_vigentes enable trigger fichadas_vigentes_a_novedades_trg;




select * 
  from fichadas_recibidas
  where migrado_estado='ERROR'
  limit 100;
  

-- */