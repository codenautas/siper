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

        v_hora_redondeada := date_trunc('minute', 
            new.hora + CASE v_tipo_mapeado WHEN 'E' THEN '0'::interval WHEN 'S' THEN '59 seconds'::interval ELSE '30 seconds'::interval END
        );

        INSERT INTO fichadas (
            idper, fecha, hora, tipo_fichada, 
            observaciones, punto, tipo_dispositivo
        ) VALUES (
            v_idper, NEW.fecha, v_hora_redondeada, v_tipo_mapeado,
            NEW.texto, NEW.punto_gps, NEW.dispositivo
        );

        NEW.migrado_estado := 'OK';
        NEW.migrado_log := 'Migrado exitosamente';

    EXCEPTION WHEN OTHERS THEN
        NEW.migrado_estado := 'ERROR';
        NEW.migrado_log := SQLERRM; 
    END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS procesar_fichada_recibida_trg ON fichadas_recibidas;
CREATE TRIGGER procesar_fichada_recibida_trg
    BEFORE INSERT ON fichadas_recibidas
    FOR EACH ROW
    EXECUTE PROCEDURE procesar_fichada_recibida_trg();
