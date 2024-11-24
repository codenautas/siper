-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION hora_texto(p_hora time) RETURNS text
  LANGUAGE SQL IMMUTABLE
AS
$SQL$
  SELECT to_char(p_hora, 'HH24:MI');
$SQL$;
