"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {año} from "./table-annios"

export function horarios(context: TableContext): TableDefinition{
    var admin = context.es.admin || context.es.rrhh;
    return {
        name: 'horarios',
        elementName: 'horario',
        title: 'horarios del personal',
        editable: admin,
        fields: [
            {...idper, editable:admin},
            {name:'dds'              , typeName:'integer'                   },
            {...año, editable:false, generatedAs:`extract(year from desde)` },
            {name: 'desde'           , typeName: 'date'   , nullable:false  },
            {name: 'hasta'           , typeName: 'date'   , nullable:false  },
            {name:'trabaja'          , typeName:'boolean' , nullable:false ,defaultValue:false},
            {name:'hora_desde'       , typeName:'time'    , nullable:false  },
            {name:'hora_hasta'       , typeName:'time'    , nullable:false  },
            {name:'lapso_fechas'     , typeName:'daterange', visible:false, generatedAs:'daterange(desde, coalesce(hasta, make_date(extract(year from desde)::integer, 12, 31)))'},
        ],
        primaryKey: [idper.name,'dds', año.name, 'desde'],
        foreignKeys: [
            {references: 'personas', fields:[idper.name], onDelete:'cascade'},
            {references: 'annios'  , fields: [año.name], onUpdate: 'no action'},
        ],
        constraints: [
            {constraintType: 'check', consName:'dia de la semana entre 0 y 6', expr: 'dds between 0 and 6'},
            {constraintType: 'check', consName:'si trabaja tiene horario', expr: '(trabaja is true) = (hora_desde is not null and hora_hasta is not null)'},
            {constraintType:'exclude', consName:'sin superponer fechas', using:'GIST', fields:[idper.name, 'dds', {fieldName:'lapso_fechas', operator:'&&'}]}
        ]
    };
}
