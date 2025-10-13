"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {horario} from "./table-horarios"
import {idper} from "./table-personas"
import {año} from "./table-annios"

export function horarios_per(context: TableContext): TableDefinition{
    var admin = context.es.rrhh;
    return {
        name: 'horarios_per',
        elementName: 'horario',
        title: 'horarios del personal',
        editable: admin,
        fields: [
            {...idper, editable:admin},
            horario,
            {name: 'dds'             , typeName:'integer'                   },
            {...año, editable:false  , generatedAs:`extract(year from desde)` },
            {name: 'desde'           , typeName: 'date'   , nullable:false  },
            {name: 'hasta'           , typeName: 'date'   , nullable:false  },
            {name: 'lapso_fechas'    , typeName:'daterange', visible:false, generatedAs:'daterange(desde, coalesce(hasta, make_date(extract(year from desde)::integer, 12, 31)))'},
        ],
        primaryKey: [idper.name, año.name, 'desde'],
        foreignKeys: [
            {references: 'personas', fields:[idper.name], onDelete:'cascade'},
            {references: 'annios'  , fields: [año.name], onUpdate: 'no action'},
            {references: 'fechas'  , fields:[{source:'desde', target:'fecha'}], alias:'desde', onDelete:'cascade'},
            {references: 'fechas'  , fields:[{source:'hasta', target:'fecha'}], alias:'hasta', onDelete:'cascade'},
        ],
        constraints: [
            {constraintType:'exclude', consName:'sin superponer fechas', using:'GIST', fields:[idper.name, 'dds', {fieldName:'lapso_fechas', operator:'&&'}]}
        ]
    };
}
