"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {fecha, añoEnBaseAFecha} from "./table-fechas"
import {sector} from "./table-sectores"
import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades"

import { politicaNovedades } from "./table-novedades_registradas";

export const sqlNovedadesVigentesConDesdeHastaHabiles = `
with novedades_fecha AS(
  SELECT 
      p.idper, nv.ficha, nv.ent_fich, nv.sal_fich, nv.sector, nv.annio, nv.trabajable, nv.detalles, f.dds, f.laborable,
    COALESCE(nv.fecha, f.fecha) as fecha,
    CASE
      WHEN cod_nov is null and (dds in (6,0) or laborable = false) then '¡FERIADO O FIN DE SEMANA!' --'888'
      WHEN cod_nov is null then '¡FECHA FUTURA SIN NOVEDAD!' --'999'
      ELSE cod_nov
    END AS cod_nov
  FROM annios INNER JOIN fechas f on f.annio = annios.annio
    INNER JOIN (SELECT DISTINCT idper, annio FROM novedades_vigentes) p on p.annio = annios.annio
    LEFT JOIN novedades_vigentes nv ON f.fecha = nv.fecha AND p.idper = nv.idper
),
novedades_vigentes_con_marca_de_cambio_de_cod_nov AS(
  select *,
      CASE 
        WHEN nv.cod_nov = LAG(nv.cod_nov) OVER (PARTITION BY nv.idper ORDER BY nv.fecha) THEN 0
        ELSE 1
      END AS hubo_cambio_cod_nov
    from novedades_fecha nv
    where cod_nov <> '¡FERIADO O FIN DE SEMANA!' --'888'
  ),
  novedades_vigentes_identificando_tiras_cod_nov_iguales AS (
    select *,
      sum(hubo_cambio_cod_nov) OVER (PARTITION BY idper order by fecha) AS numero_tira_cod_nov_iguales
    from novedades_vigentes_con_marca_de_cambio_de_cod_nov
  ),
  novedades_vigentes_desde_hasta AS (
  select *, 
      MIN(ncg.fecha) OVER (PARTITION BY ncg.idper, ncg.numero_tira_cod_nov_iguales) AS desde,
      MAX(ncg.fecha) OVER (PARTITION BY ncg.idper, ncg.numero_tira_cod_nov_iguales) AS hasta,
      COUNT(ncg.fecha) OVER (PARTITION BY ncg.idper, ncg.numero_tira_cod_nov_iguales) AS habiles
    from novedades_vigentes_identificando_tiras_cod_nov_iguales ncg
    order by ncg.idper, ncg.numero_tira_cod_nov_iguales
  )
  select idper, fecha, cod_nov, ficha, ent_fich, sal_fich, sector, annio, trabajable, detalles,
         desde, hasta, habiles, hasta - desde + 1 as corridos
    from novedades_vigentes_desde_hasta`

export function novedades_vigentes(context: TableContext): TableDefinition {
    var admin = context.es.admin;
    return {
        name:'novedades_vigentes',
        elementName:'novedad',
        editable:admin,
        fields: [
            idper,
            fecha,
            {name: 'ddsn'     , typeName: 'text'   , inTable:false, serverSide:true, editable:false },
            {name: 'cod_nov'  , typeName: 'text'   ,                                    },
            {name: 'ficha'    , typeName: 'text'   ,                                    },
            /* campos de sistemas externos: */
            {name: 'ent_fich' , typeName: 'text'   , title:'entrada - fichada'          },
            {name: 'sal_fich' , typeName: 'text'   , title:'salida - fichada'           },
            /* campos redundantes que reflejan el estado del personas al momento de obtener la novedad */
            {name: 'sector'   , typeName: 'text'   ,                                    },
            /* campos automáticos */
            añoEnBaseAFecha                                                              ,
            {name: 'trabajable' , typeName: 'boolean', description: 'si es un día que debe trabajar según su horario (normalmente día hábil, no feriado)' },
            {name: 'detalles'   , typeName: 'text'   ,                                    },
        ],
        primaryKey: [idper.name, fecha.name],
        foreignKeys: [
            {references:'personas'     , fields: [idper.name]},
            {references:'fechas'       , fields: [fecha.name]},
            {references:'sectores'     , fields: [sector.name], onDelete:'set null'},
            {references:'cod_novedades', fields: [cod_nov.name]},
        ],
        sql: {
            fields: {
                ddsn:{ expr:`case extract(dow from novedades_vigentes.fecha) when 0 then 'domingo' when 1 then 'lunes' when 2 then 'martes' when 3 then 'miércoles' when 4 then 'jueves'when 5 then 'viernes' when 6 then 'sábado' end`},
            },
            skipEnance: true, 
            policies: politicaNovedades('novedades_vigentes','fecha'),
        },
        hiddenColumns: [añoEnBaseAFecha.name]
    };
}
