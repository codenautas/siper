"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {fecha, añoEnBaseAFecha} from "./table-fechas"
import {sector} from "./table-sectores"
import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades"

import { politicaNovedades } from "./table-novedades_registradas";

export function novedades_vigentes(context: TableContext): TableDefinition {
    var admin = context.user.rol==='admin';
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
            {name: 'prioridad'  , typeName: 'integer',                                    },
            {name: 'detalles'   , typeName: 'text'   ,                                    },
        ],
        primaryKey: [idper.name, fecha.name],
        foreignKeys: [
            {references:'personas'     , fields: [idper.name]},
            {references:'fechas'       , fields: [fecha.name]},
            {references:'sectores'     , fields: [sector.name]},
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
