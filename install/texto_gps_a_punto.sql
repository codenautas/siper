/* Convierte el texto con coordenadas GPS que envían los dispositivos en un point de PostgreSQL,
   con la convención (x,y) = (longitud,latitud), la misma que usa earthdistance para el operador <@>.
   Formatos aceptados:
     - "latitud,longitud" (el formato de fichadas_recibidas.punto_gps, ej: "-34.603,-58.382")
     - "(longitud,latitud)" (el literal nativo de point; el orden es el inverso al anterior,
       se distingue por el paréntesis)
   Puede lanzar los errores códigos P1012 y P1013 (ver contracts.ts).
*/

CREATE OR REPLACE FUNCTION texto_gps_a_punto(p_texto text) RETURNS point
    IMMUTABLE
    LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_latitud  decimal;
    v_longitud decimal;
    v_punto    point;
BEGIN
    IF p_texto IS NULL OR p_texto = '' THEN
        RETURN null;
    ELSIF p_texto ~ '^\s*\(' THEN
        v_punto := p_texto::point; -- si el literal está mal formado el cast lanza su propio error
        v_longitud := v_punto[0];
        v_latitud  := v_punto[1];
    ELSE
        RAISE 'texto GPS no interpretable: %', p_texto USING ERRCODE = 'P1013';
    END IF;
    IF abs(v_latitud) > 90 OR abs(v_longitud) > 180 THEN
        RAISE 'coordenadas GPS fuera de rango: %', p_texto USING ERRCODE = 'P1012';
    END IF;
    RETURN point(round(v_longitud, 4), round(v_latitud, 4));
END;
$BODY$;


CREATE OR REPLACE FUNCTION textolatlong_gps_a_punto(p_texto text) RETURNS point
    IMMUTABLE
    LANGUAGE plpgsql
AS $BODY$
DECLARE
    v_latitud  decimal;
    v_longitud decimal;
    v_punto    point;
BEGIN
    IF p_texto IS NULL OR p_texto = '' THEN
        RETURN null;
    ELSIF p_texto ~ '^\s*[-+]?\d+(\.\d+)?\s*,\s*[-+]?\d+(\.\d+)?\s*$' THEN
        v_latitud  := split_part(p_texto, ',', 1);
        v_longitud := split_part(p_texto, ',', 2);
    ELSE
        RAISE 'latitud y longitud no interpretables: %', p_texto USING ERRCODE = 'P1013';
    END IF;
    IF abs(v_latitud) > 90 OR abs(v_longitud) > 180 THEN
        RAISE 'coordenadas GPS fuera de rango: %', p_texto USING ERRCODE = 'P1012';
    END IF;
    RETURN point(round(v_longitud, 4), round(v_latitud, 4));
END;
$BODY$;
