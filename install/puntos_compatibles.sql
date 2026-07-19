/* Indica si las fichadas con punto GPS de una persona en una fecha son compatibles
   con los puntos de referencia que corresponden al código de novedad:
     - se podría agregar un booleano con_puntos (por ahora toma injustificado y cuenta_horas)
     - los códigos que no comparan devuelven null
   Es compatible cuando para cada horario recibido (hoy: la entrada y la salida; se podría
   extender a todos los extremos del multirango de fichadas) hay alguna fichada con punto
   a media hora de ese horario y a menos de 500 metros de alguna referencia.
   Devuelve null si no recibe horarios o si alguno es desconocido (null).
*/

lowerCREATE OR REPLACE FUNCTION puntos_compatibles(p_idper text, p_fecha date, p_cod_nov text, p_horas time[]) RETURNS boolean
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
    IF c_con_puntos IS NOT TRUE
    THEN
        RETURN null;
    END IF;
    RETURN (
        WITH referencias AS (
            SELECT punto FROM sedes
                WHERE p_cod_nov <> '101' AND para_presencial AND punto IS NOT NULL
            UNION ALL
            SELECT punto FROM per_domicilios
                WHERE p_cod_nov = '101' AND idper = p_idper
                  AND tipo_domicilio IN ('P', 'TA') AND punto IS NOT NULL
        )
        SELECT bool_and(EXISTS (
            SELECT 1
                FROM fichadas f
                    JOIN referencias r ON (f.punto <@> r.punto) * c_metros_por_milla <= c_metros_maximos
                WHERE f.idper = p_idper AND f.fecha = p_fecha AND f.punto IS NOT NULL
                  AND f.hora BETWEEN h - c_ventana AND h + c_ventana
        ))
        FROM unnest(p_horas) h
        WHERE h IS NOT NULL
    );
END;
$BODY$;