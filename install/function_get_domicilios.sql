CREATE OR REPLACE FUNCTION siper.get_domicilios(
	p_idper text)
    RETURNS text
    LANGUAGE 'sql'
    COST 100
    VOLATILE SECURITY DEFINER PARALLEL UNSAFE
AS $BODY$
select string_agg(tipo_domicilio || ' : ' || nombre_calle || ' ' || altura 
  						 || coalesce(' (CP:' || codigo_postal || ')', '') 
  						 || coalesce(' - Piso:' || piso, '') 
						 || coalesce(' - Depto:' || depto, '')
						 || coalesce(' - Torre:' || torre, '')
						 || coalesce(' - Nudo:' || nudo, '')
						 || coalesce(' - Ala:' || ala, '')
						 || coalesce(' - Prov:' || p.nombre_provincia, '')
						 || coalesce(' - Loc:' || l.nombre_localidad, '')
						 || coalesce(' - Barrio:' || b.nombre_barrio, '')
						 || coalesce(' - Obs:' || observaciones, '')
						 , ' , '
						 ) as domicilios
from per_domicilios pd
left join provincias p on p.provincia = pd.provincia
left join localidades l on pd.localidad = l.localidad and pd.provincia = l.provincia
left join barrios b on b.barrio = pd.barrio
where idper = p_idper
group by idper
$BODY$;

ALTER FUNCTION siper.get_domicilios(text)
    OWNER TO siper_owner;
