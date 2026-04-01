DROP TRIGGER IF EXISTS tr_sincro_modalidad_usuarios ON "novedades_vigentes";

CREATE OR REPLACE FUNCTION fn_trigger_sincro_modalidad_usuarios() RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
AS
$$
DECLARE
    v_modalidad text;
BEGIN
      select modalidad_trabajo into v_modalidad from cod_novedades where cod_nov = NEW.cod_nov;
      --chequear fecha actual
      if(new.fecha = fecha_actual() and v_modalidad is not null) then
        UPDATE usuarios 
          set modalidad_trabajo = v_modalidad
          where idper = new.idper;
      end if;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER tr_sincro_modalidad_usuarios
    AFTER INSERT OR UPDATE
    ON "novedades_vigentes"
    FOR EACH ROW
    EXECUTE FUNCTION siper.fn_trigger_sincro_modalidad_usuarios();