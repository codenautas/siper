-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

/* ATENCIÓN: Esta función y este archivo se declaran 2 veces porque hay una dependencia circular:
 * Se necesita la función para crear las políticas de las tablas y
 * Se necesita la tabla parámetros para la creación de la función
 */
   
do $cmd$
DECLARE
  v_ya_existen_las_tablas boolean := (SELECT true FROM information_schema.tables WHERE table_name='parametros' AND table_schema='siper');
BEGIN
  IF v_ya_existen_las_tablas THEN
    CREATE OR REPLACE FUNCTION fecha_hora_actual() returns timestamp
      language sql stable
    AS
    $sql$
      SELECT coalesce(fecha_hora_para_test, current_timestamp)
        from parametros
        where unico_registro;
    $sql$;
  ELSE
    CREATE OR REPLACE FUNCTION fecha_hora_actual() returns timestamp
      language sql stable
    AS
    $sql$
      SELECT null::timestamp;
    $sql$;
  END IF;
END;
$cmd$;

CREATE OR REPLACE FUNCTION fecha_actual() returns date
    language sql stable
AS
$sql$
    SELECT date_trunc('day', fecha_hora_actual());
$sql$;