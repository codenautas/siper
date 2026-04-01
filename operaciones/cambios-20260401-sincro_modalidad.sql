set search_path=siper;
SET ROLE siper_muleto_owner;
--SET ROLE siper_owner;

create table "modalidades_trabajo" (
  "modalidad" text, 
  "nombre" text
, primary key ("modalidad")
);
grant select, insert, update, delete on "modalidades_trabajo" to siper_muleto_admin;
grant all on "modalidades_trabajo" to siper_muleto_owner;

alter table "modalidades_trabajo" add constraint "modalidad<>''" check ("modalidad"<>'');
alter table "modalidades_trabajo" add constraint "nombre<>''" check ("nombre"<>'');

insert into modalidades_trabajo (modalidad, nombre) values ('pres', 'presencial'),('tele','teletrabajo');

alter table "usuarios" add column modalidad_trabajo text;
alter table "usuarios" add constraint "modalidad_trabajo<>''" check ("modalidad_trabajo"<>'');

alter table "usuarios" add constraint "usuarios modalidades_trabajo REL" foreign key ("modalidad_trabajo") references "modalidades_trabajo" ("modalidad")  on update cascade;
create index "modalidad_trabajo 4 usuarios IDX" ON "usuarios" ("modalidad_trabajo");

alter table "cod_novedades" add column modalidad_trabajo text;
alter table "cod_novedades" add constraint "modalidad_trabajo<>''" check ("modalidad_trabajo"<>'');

alter table "cod_novedades" add constraint "cod_novedades modalidades_trabajo REL" foreign key ("modalidad_trabajo") references "modalidades_trabajo" ("modalidad")  on update cascade;
create index "modalidad_trabajo 4 cod_novedades IDX" ON "cod_novedades" ("modalidad_trabajo");

update cod_novedades set modalidad_trabajo = 'pres' where cod_nov = '999'; --pk verificada
update cod_novedades set modalidad_trabajo = 'tele' where cod_nov = '101'; --pk verificada

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



DROP TRIGGER IF EXISTS tr_sincro_usuarios_modulo_global ON "usuarios";

CREATE TRIGGER tr_sincro_usuarios_modulo_global
    AFTER INSERT OR DELETE OR UPDATE OF usuario, activo, hashpass, idper, modalidad_trabajo
    ON "usuarios"
    FOR EACH ROW
    EXECUTE FUNCTION siper.fn_trigger_sincro_usuarios_modulo();

