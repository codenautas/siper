set search_path = siper;

/*
delete from fechas;

insert into fechas (fecha)
  select fecha 
	from generate_series('2023-01-01'::date, '2024-12-31'::date, interval '1 day') fecha;

-- delete from cod_nov;

insert into cod_nov (cod_nov, novedad, c_dds)
  select cod_nov, novedad, case when novedad like '% Diagra%' then true else null end
    from (select n.cod_nov, string_agg(distinct n.novedad,'|') as novedad
	        from nov_per_importado n left join cod_nov c on c.cod_nov = n.cod_nov
	        where c.cod_nov is null
	        group by n.cod_nov) n;

-- delete from sectores ;

insert into sectores (sector, nombre_sector)
  select num+cant, nombre_sector
    from (select n.sector as nombre_sector, row_number() over (order by n.sector) num 
	        from nov_per_importado n left join sectores c on c.nombre_sector = n.sector
	        where c.sector is null
	        group by n.sector) n,
         (select count(*) cant from sectores) c;

insert into sectores (sector, nombre_sector)
  select num+cant, nombre_sector
    from (select n.sector as nombre_sector, row_number() over (order by n.sector) num 
	        from novedades_importadas n left join sectores c on c.nombre_sector = n.sector
	        where c.sector is null
	        group by n.sector) n,
         (select count(*) cant from sectores) c;
-- */


select ficha, count(distinct cuil), count(distinct idmeta4), count(distinct nomyape) ,max(cuil), min(cuil)
  from novedades_importadas
	group by ficha
  having count(distinct cuil)>1 or count(distinct idmeta4)>1 or count(distinct nomyape)>1;

select cuil, count(distinct ficha), count(distinct idmeta4), count(distinct nomyape) ,max(ficha), min(ficha)
  from novedades_importadas
	group by cuil
  having count(distinct ficha)>1 or count(distinct idmeta4)>1 or count(distinct nomyape)>1;


-- delete from personal ;

insert into personal (ficha, cuil, idmeta4, nomyape, sector)
	select ficha, cuil, nullif(idmeta4,''), nomyape, sector 
	  from
    (select cuil, ficha, idmeta4, nomyape, c.sector,
	        row_number() over (partition by cuil order by fecha desc) num 
	    from novedades_importadas n 
	         left join sectores c on c.nombre_sector = n.sector) n
      where num = 1;



-- delete from novedades_vigentes;

insert into novedades_vigentes (cuil, ficha, fecha, cod_nov, sector)
	select cuil, ficha, fecha, c.cod_nov, s.sector
	    from novedades_importadas n 
            left join sectores s on s.nombre_sector = n.sector
            left join cod_nov c on c.novedad = n.cod_nov
	where c.cod_nov is not null;

*/

	select cuil, ficha, fecha, c.cod_nov, s.sector, n.cod_nov
	    from novedades_importadas n 
            left join sectores s on s.nombre_sector = n.sector
            left join cod_nov c on c.novedad = n.cod_nov
	    where c.novedad is null;


	
select * from novedades_vigentes where false;
	

select n.cod_nov, n.novedad, sum(cantidad::bigint)
  from nov_per_importado n
  where cod_nov in ('59','999','101')
  group by n.cod_nov, n.novedad
  order by 1, 2;

select *, extract(dow from fecha), (select count(*) from novedades_vigentes n where f.fecha = n.fecha)
  from fechas f
  where extract(dow from fecha) between 1 and 5
    and laborable is null = not exists (select 1 from novedades_vigentes n where f.fecha = n.fecha limit 1)
  order by fecha asc
  limit 200;

insert into per_gru (persona, clase, grupo)
  (select
	cuil
	'S',
  select case 
	when cuil like '20%' then 'M' 
	when cuil like '27%' then 'F'
    when cuil like '27%9' then 'M'
    when cuil like '27%4' then 'F'
    else 'X'
  end
  from personas);
