"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {año} from "./table-annios"
import {cod_nov} from "./table-cod_novedades";

export function horarios(context: TableContext): TableDefinition{
    var admin = context.user.rol==='admin' || context.user.rol==='rrhh';
    return {
        name: 'horarios',
        elementName: 'horario',
        title: 'Horarios del personal',
        editable: admin,
        fields: [
            {...idper, editable:admin},
            {name:'dds'              , typeName:'integer'                   },
            {...año, editable:false, generatedAs:`extract(year from desde)` },
            {name: 'desde'           , typeName: 'date'   ,                 },
            {name: 'hasta'           , typeName: 'date'   ,                 },
            cod_nov,
            {name:'trabaja'          , typeName:'boolean' , nullable:false ,defaultValue:false},
            {name:'hora_desde'       , typeName:'time'                      },
            {name:'hora_hasta'       , typeName:'time'                      },
        ],
        primaryKey: [idper.name,'dds', año.name, 'desde'],
        foreignKeys: [
            {references: 'personas', fields:[idper.name], onDelete:'cascade'},
            {references: 'annios'  , fields: [año.name], onUpdate: 'no action'},
            {references: 'cod_novedades', fields: [cod_nov.name]},
        ],
        constraints: [
            {constraintType: 'check', consName:'dia de la semana entre 0 y 6', expr: 'dds between 0 and 6'},
        ]
    };
}
