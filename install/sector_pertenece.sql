-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;
DROP FUNCTION IF EXISTS sector_pertenece(p_sector text, p_pertenece_a text);

CREATE OR REPLACE FUNCTION sector_pertenece(p_sector text, p_pertenece_a text, p_iteraciones numeric = 10) RETURNS boolean
  LANGUAGE SQL STABLE
AS
$BODY$
  select case p_iteraciones when 0 then null
      else sector is not null and (sector = p_pertenece_a or sector_pertenece(pertenece_a, p_pertenece_a, p_iteraciones -1)) is true
    end
    from sectores where sector = p_sector;
$BODY$;

/*

delete from sectores where nombre_sector like 'PRUEBA AUTOM_TICA%';
insert into sectores (sector, nombre_sector, pertenece_a) values
                        ('PRA1'   , 'PRUEBA AUTOMATICA 1'      , null    ),
                        ('PRA11'  , 'PRUEBA AUTOMATICA 1.1'    , 'PRA1'  ),
                        ('PRA111' , 'PRUEBA AUTOMATICA 1.1.1'  , 'PRA11' ),
                        ('PRA1111', 'PRUEBA AUTOMATICA 1.1.1.1', 'PRA111'),
                        ('PRA12'  , 'PRUEBA AUTOMATICA 1.2'    , 'PRA1'  );

select 1, sector_pertenece('PRA11', 'PRA111'), FALSE
UNION select 2, sector_pertenece('PRA111', 'PRA11'), TRUE
UNION select 3, sector_pertenece('PRA111', 'PRA1'), TRUE
UNION select 4, sector_pertenece('PRA1111', 'PRA1'), TRUE
UNION select 5, sector_pertenece('PRA1111', 'CUALQUIERA'), FALSE
UNION select 6, sector_pertenece('CUALQUIERA', 'PRA11'), FALSE
UNION select 7, sector_pertenece('PRA11', 'PRA11'), TRUE

-- */
                  
