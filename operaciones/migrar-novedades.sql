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

-- /* -- Sección fichadas
insert into fichadas (idper, fecha, hora, origen)
  select idper, fecha, ent_fich::time, 'migracion'
    from novedades_importadas inner join personas using (cuil)
    where ent_fich <> '';

insert into fichadas (idper, fecha, hora, origen)
  select idper, fecha, sal_fich::time, 'migracion'
    from novedades_importadas inner join personas using (cuil)
    where sal_fich <> '';
-- */

drop table if exists temp_novedades_a_migrar;
create temporary table temp_novedades_a_migrar as
  SELECT cuil, fecha, 
      string_agg(distinct case when cn.con_novedad then cn.cod_nov when cn.cod_nov is null then cn.novedad  else null end, ' ||| ') as cod_nov_alt,
      string_agg(distinct case when cp.con_novedad then cp.cod_nov when cp.cod_nov is null then presentismo else null end, ' ||| ') as cod_nov
	FROM siper.novedades_importadas x 
      LEFT JOIN cod_novedades cn on x.novedad = cn.novedad
      LEFT JOIN cod_novedades cp on x.presentismo = cp.novedad
    GROUP BY cuil, fecha;

alter table temp_novedades_a_migrar add primary key (cuil, fecha);

select 'ERROR!!!!!!!!!!!!!!!!',*
  from temp_novedades_a_migrar 
  where cod_nov like '%|||%' or cod_nov_alt like '%|||%'
    OR length(cod_nov)>4 or length(cod_nov_alt)>4 
    ;

select *
  from temp_novedades_a_migrar 
  where cod_nov<>cod_nov_alt
    ;

insert into novedades_registradas (idper, cod_nov, desde, hasta, detalles)
  select idper, cod_nov, min(desde), max(hasta), case when con_detalles then 'migración' else null end
    from (
      select p.idper, x.cod_nov, c.novedad, con_detalles,
             min(fecha) over (partition by idper, x.cod_nov order by fecha) as desde,
             max(fecha) over (partition by idper, x.cod_nov order by fecha) as hasta,
             ROW_NUMBER() OVER (ORDER BY idper, fecha) - ROW_NUMBER() OVER (PARTITION BY idper, x.cod_nov ORDER BY fecha) AS grupo,
             'migracion'
          from temp_novedades_a_migrar x inner join personas p using (cuil)
            inner join cod_novedades c on c.cod_nov = x.cod_nov
          order by idper, fecha
      ) x
    group by grupo, idper, cod_nov, novedad, con_detalles;

  