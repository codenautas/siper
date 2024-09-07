-- EJECUTAR LOCALMENTE, NO DESCOMENTAR Y COMMITEAR:
-- SET search_path = siper; SET ROLE siper_owner;

CREATE OR REPLACE FUNCTION sector_pertenece(p_sector text, p_pertenece_a text) RETURNS boolean
  LANGUAGE SQL STABLE
AS
$BODY$
  select pertenece_a is not null and (pertenece_a = p_pertenece_a or sector_pertenece(pertenece_a, p_pertenece_a))
    from sectores where sector = p_sector;
$BODY$;

/*

select 1, sector_pertenece('PRA11', 'PRA111'), FALSE
UNION select 2, sector_pertenece('PRA111', 'PRA11'), TRUE
UNION select 3, sector_pertenece('PRA111', 'PRA1'), TRUE
UNION select 4, sector_pertenece('PRA1111', 'PRA1'), TRUE
UNION select 5, sector_pertenece('PRA1111', 'CUALQUIERA'), FALSE
UNION select 5, sector_pertenece('CUALQUIERA', 'PRA11'), FALSE

-- */
                  
