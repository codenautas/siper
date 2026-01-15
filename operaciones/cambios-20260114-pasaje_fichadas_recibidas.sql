set search_path=siper;
SET ROLE siper_muleto_owner;
--SET ROLE siper_owner;

ALTER TABLE fichadas_recibidas 
  ADD COLUMN migrado_estado text DEFAULT 'PENDIENTE';

ALTER TABLE fichadas_recibidas 
  ADD COLUMN migrado_log text;

ALTER TABLE fichadas_recibidas 
  ALTER COLUMN migrado_estado SET NOT NULL;

CREATE OR REPLACE FUNCTION procesar_fichada_recibida_trg() RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
AS
$$
DECLARE
    v_idper text;
    v_tipo_mapeado text;
BEGIN
    BEGIN
        SELECT idper INTO v_idper 
        FROM usuarios 
        WHERE usuario = NEW.fichador;

        IF v_idper IS NULL THEN
            RAISE EXCEPTION 'Usuario "%" no encontrado en la tabla usuarios', NEW.fichador;
        END IF;
        
        CASE 
            WHEN lower(NEW.tipo) IN ('e', 'entrada') THEN v_tipo_mapeado := 'E';
            WHEN lower(NEW.tipo) IN ('s', 'salida')  THEN v_tipo_mapeado := 'S';
            ELSE v_tipo_mapeado := 'O';
        END CASE;

        INSERT INTO fichadas (
            idper, fecha, hora, tipo_fichada, 
            observaciones, punto, tipo_dispositivo
        ) VALUES (
            v_idper, NEW.fecha, NEW.hora, v_tipo_mapeado,
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
