SET search_path = siper; SET ROLE siper_owner;

/*
select * from novedades_importadas limit 10;
*/

-- /* -- NO ELIMINAR ESTE BLOQUE
delete from fichadas;
delete from novedades_vigentes;
delete from novedades_registradas;
delete from novedades_vigentes;
-- */

insert into fichadas (idper, fecha, hora, origen)
  select idper, fecha, ent_fich::time, 'migracion'
    from novedades_importadas inner join personas using (cuil)
    where ent_fich <> '';

insert into fichadas (idper, fecha, hora, origen)
  select idper, fecha, sal_fich::time, 'migracion'
    from novedades_importadas inner join personas using (cuil)
    where sal_fich <> '';
