"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {fecha, añoEnBaseAFecha} from "./table-fechas"
import {sector} from "./table-sectores"
import {cuil} from "./table-personal"
import {cod_nov} from "./table-cod_novedades"

export function novedades_vigentes(context: TableContext): TableDefinition {
    var admin = context.user.rol==='admin';
    return {
        name:'novedades_vigentes',
        elementName:'novedad',
        editable:admin,
        fields: [
            cuil,
            {name: 'ficha'    , typeName: 'text'   ,                                    },
            fecha,
            {name: 'dds'      , typeName: 'text'   , inTable:false, serverSide:true, editable:false },
            {name: 'cod_nov'  , typeName: 'text'   ,                                    },
            /* campos de sistemas externos: */
            {name: 'ent_fich' , typeName: 'text'   , title:'entrada - fichada'          },
            {name: 'sal_fich' , typeName: 'text'   , title:'salida - fichada'           },
            /* campos redundantes que reflejan el estado del personal al momento de obtener la novedad */
            {name: 'sector'   , typeName: 'text'   ,                                    },
            /* campos automáticos */
            añoEnBaseAFecha
        ],
        primaryKey: [cuil.name, fecha.name],
        foreignKeys: [
            {references:'personal'     , fields: [cuil.name]},
            {references:'fechas'       , fields: [fecha.name]},
            {references:'sectores'     , fields: [sector.name]},
            {references:'cod_novedades', fields: [cod_nov.name]},
        ],
        sql: {
            fields: {
                dds:{ expr:`case extract(dow from novedades_vigentes.fecha) when 0 then 'domingo' when 1 then 'lunes' when 2 then 'martes' when 3 then 'miércoles' when 4 then 'jueves'when 5 then 'viernes' when 6 then 'sábado' end`},
            }
        },
        hiddenColumns: [añoEnBaseAFecha.name]
    };
}
