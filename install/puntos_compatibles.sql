/* Indica si las fichadas con punto GPS de una persona en una fecha son compatibles
   con los puntos de referencia que corresponden al código de novedad:
     - 101 (teletrabajo): los domicilios declarados de la persona
       (per_domicilios con tipo_domicilio 'P' o 'TA' y punto calculado)
     - cualquier otro código que compara (por ahora solo 999): las sedes con para_presencial
     - los códigos que no comparan devuelven null
   Es compatible cuando para cada horario recibido (hoy: la entrada y la salida; se podría
   extender a todos los extremos del multirango de fichadas) hay alguna fichada con punto
   a media hora de ese horario y a menos de 500 metros de alguna referencia.
   Devuelve null si no recibe horarios o si alguno es desconocido (null).
   EXCEPCIÓN a la regla de no depender del código de novedad: los códigos 101 y 999 están
   hardcodeados a propósito por ahora; cuando haya más códigos que comparen, pasar esta
   configuración a campos de cod_novedades. */

CREATE OR REPLACE FUNCTION puntos_compatibles(p_idper text, p_fecha date, p_cod_nov text, p_horas time[]) RETURNS boolean
    STABLE
    LANGUAGE plpgsql
    SET search_path = siper, public
AS $BODY$
DECLARE
    c_metros_maximos   CONSTANT double precision := 500;
    c_metros_por_milla CONSTANT double precision := 1609.344; -- el operador <@> de earthdistance devuelve millas terrestres
    c_ventana          CONSTANT interval := '30 minutes';
BEGIN
    IF p_cod_nov IS NULL OR p_cod_nov NOT IN ('101', '999')
        OR p_horas IS NULL OR cardinality(p_horas) = 0
        OR array_position(p_horas, null) IS NOT NULL
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
    );
END;
$BODY$;
