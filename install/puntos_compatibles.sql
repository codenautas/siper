/* Indica si las fichadas con punto GPS de una persona en una fecha, alrededor de un horario
   (la primera entrada o la última salida), son compatibles con los puntos de referencia que
   corresponden al código de novedad:
     - se podría agregar un booleano con_puntos (por ahora toma injustificado y cuenta_horas)
   Mira las fichadas con punto que están a media hora del horario recibido y devuelve:
     - 'compatible'     si alguna está a menos de 500 metros de alguna referencia
                        (alcanza con una, aunque haya otras que no lo estén)
     - 'sin_compatible' si hay fichadas con punto pero ninguna está cerca de una referencia
     - 'sin_punto'      si no hay ninguna fichada con punto
     - null             si el código no compara puntos o si el horario es desconocido (null)
*/

CREATE OR REPLACE FUNCTION puntos_compatibles(p_idper text, p_fecha date, p_cod_nov text, p_hora time) RETURNS text
    STABLE
    LANGUAGE plpgsql
    SET search_path = siper, public
AS $BODY$
DECLARE
    c_metros_maximos   CONSTANT double precision := 500;
    c_metros_por_milla CONSTANT double precision := 1609.344; -- el operador <@> de earthdistance devuelve millas terrestres
    c_ventana          CONSTANT interval := '30 minutes';
    c_con_puntos       CONSTANT boolean := (select injustificado OR cuenta_horas FROM cod_novedades WHERE cod_nov = p_cod_nov);
BEGIN
    IF c_con_puntos IS NOT TRUE OR p_hora IS NULL
    THEN
        RETURN null;
    END IF;
    RETURN (
        WITH referencias AS (
            SELECT punto FROM sedes
                WHERE para_presencial AND punto IS NOT NULL
            UNION ALL
            SELECT punto FROM per_domicilios
                WHERE p_cod_nov = '101' AND idper = p_idper
                    AND tipo_domicilio IN ('P', 'TA') AND punto IS NOT NULL
        ), fichadas_con_punto AS (
            SELECT f.punto
                FROM fichadas f
                WHERE f.idper = p_idper AND f.fecha = p_fecha AND f.punto IS NOT NULL
                  AND f.hora BETWEEN p_hora - c_ventana AND p_hora + c_ventana
        )
        SELECT CASE
                WHEN NOT EXISTS (SELECT 1 FROM fichadas_con_punto) THEN 'sin_punto'
                WHEN EXISTS (
                    SELECT 1
                        FROM fichadas_con_punto f
                            JOIN referencias r ON (f.punto <@> r.punto) * c_metros_por_milla <= c_metros_maximos
                ) THEN 'compatible'
                ELSE 'sin_compatible'
            END
    );
END;
$BODY$;
