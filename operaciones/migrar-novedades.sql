SET search_path = siper; SET ROLE siper_owner;

/*
select * from novedades_importadas limit 10;
*/

/* -- NO ELIMINAR ESTE BLOQUE
delete from fichadas;
delete from novedades_vigentes;
delete from novedades_registradas;
delete from novedades_vigentes;
-- */

-- /* -- Sección fichadas

-- select count(*) from fichadas;
insert into fichadas (idper, fecha, hora, origen)
  select idper, fecha, 
    case  
      when g = 1 then ent_fich::time 
      when g = 2 then sal_fich::time 
      -- grupos 3 y 4 son solo para la DEMO!!!!
      when g = 3 and substr(idper,3,1)='4' then ent_fich::time + '4 minutes'::interval
      when g = 4 and substr(idper,3,1)='4' then sal_fich::time - '4 minutes'::interval
      when g = 3 and substr(idper,3,1)='5' then ent_fich::time + (sal_fich::time - ent_fich::time) * 0.4
      when g = 4 and substr(idper,3,1)='5' then ent_fich::time + (sal_fich::time - ent_fich::time) * 0.6
    end,
    'migracion'
  from novedades_importadas inner join personas using (cuil),
      generate_series(1,4) g
  where 
    case 
      when g = 1 then ent_fich <> ''
      when g = 2 then sal_fich <> ''
      else (substr(idper,3,1) in ('4','5') and ent_fich <> '' and sal_fich <> '')
    end;
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

-- select count(*) from novedades_registradas;

insert into novedades_registradas (idper, cod_nov, desde, hasta, detalles)
  select idper, cod_nov, min(fecha), max(fecha), case when con_detalles then 'migración' else null end
    from (
      select p.idper, x.cod_nov, c.novedad, con_detalles, fecha, 
             ROW_NUMBER() OVER (ORDER BY idper, fecha) - ROW_NUMBER() OVER (PARTITION BY idper, x.cod_nov ORDER BY fecha) AS grupo,
             'migracion'
          from temp_novedades_a_migrar x inner join personas p using (cuil)
            left join cod_novedades c on c.cod_nov = x.cod_nov
          order by idper, fecha
      ) x
    where cod_nov is not null
    group by grupo, idper, cod_nov, novedad, con_detalles;

select * from novedades_registradas order by idper, desde, hasta;
