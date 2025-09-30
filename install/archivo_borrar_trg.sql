CREATE OR REPLACE FUNCTION archivo_borrar_trg()
    RETURNS trigger
    LANGUAGE 'plpgsql' 
AS $BODY$
begin
  if old.archivo_nombre_fisico is not null then
    insert into archivos_borrar ("ruta_archivo") values (old.archivo_nombre_fisico);
  end if;
  return old;
end;
$BODY$;

CREATE TRIGGER archivo_borrar_trg
  BEFORE DELETE 
  ON adjuntos
  FOR EACH ROW
  EXECUTE PROCEDURE archivo_borrar_trg();