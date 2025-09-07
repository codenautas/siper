set search_path=siper;
--SET ROLE siper_muleto_owner;
SET ROLE siper_owner;

CREATE OR REPLACE PROCEDURE siper.agregar_novedades_persona_idper(p_idper text)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insertar en la tabla "per_nov_cant" por cada novedad comun
    INSERT INTO siper.per_nov_cant (annio, cod_nov, idper, origen, cantidad, comienzo, vencimiento)
        (WITH parametros_annio AS (
            SELECT extract(YEAR FROM fecha_actual) AS annio
            FROM parametros WHERE unico_registro
        )
        SELECT pa.annio as annio, cc.cod_nov, p_idper as idper, 
        pa.annio as origen, cc.cantidad, null, null
            FROM siper.cod_novedades cc, parametros_annio pa
            WHERE cc.inicializar = true)
    ON CONFLICT (annio, cod_nov, idper, origen) DO NOTHING;
END;
$$;
