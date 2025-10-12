"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {año} from "./table-annios"

export function horarios_per(context: TableContext): TableDefinition{
    var admin = context.es.rrhh;
    return {
        name: 'horarios_per',
        elementName: 'horario_per',
        title: 'horarios del personal',
        editable: admin,
        fields: [
            {...idper, editable:admin},
            {name: 'horario'         , typeName: 'text'                     },
            //{name:'dds'              , typeName:'integer'                   },
            {name: 'desde'           , typeName: 'date'                     },
            {name: 'hasta'           , typeName: 'date'                     },
            //{name:'trabaja'          , typeName:'boolean' , nullable:false ,defaultValue:false},
            //{name:'hora_desde'       , typeName:'time'    , nullable:false  },
            //{name:'hora_hasta'       , typeName:'time'    , nullable:false  },
            {name:'lapso_fechas'     , typeName:'daterange', visible:false, generatedAs:'daterange(desde, coalesce(hasta, make_date(extract(year from desde)::integer, 12, 31)))'},
            //dejo año para facilitar luego en las consultas que lo requieran
            {...año, editable:false, generatedAs:`extract(year from desde)` },
        ],
        //primaryKey: [idper.name, 'dds', año.name, 'desde'],
        primaryKey: [idper.name, 'horario', 'desde'],
        foreignKeys: [
            {references: 'personas', fields:[idper.name], onDelete:'cascade'},
            {references: 'annios'  , fields: [año.name], onUpdate: 'no action'},
            {references: 'fechas'  , fields:[{source:'desde', target:'fecha'}], alias:'desde', onDelete:'cascade'},
            {references: 'fechas'  , fields:[{source:'hasta', target:'fecha'}], alias:'hasta', onDelete:'cascade'},
            //va fk contra la nueva referencial de horarios
        ],
        constraints: [
            //{constraintType: 'check', consName:'dia de la semana entre 0 y 6', expr: 'dds between 0 and 6'},
            //{constraintType: 'check', consName:'si trabaja tiene horario', expr: '(trabaja is true) = (hora_desde is not null and hora_hasta is not null)'},
            {constraintType:'exclude', consName:'sin superponer fechas', using:'GIST', fields:[idper.name, 'horario', {fieldName:'lapso_fechas', operator:'&&'}]}
        ]
    };
}
