"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"

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
            {name:'trabaja'          , typeName:'boolean' , nullable:false ,defaultValue:false},
            {name:'hora_desde'       , typeName:'time'                      },
            {name:'hora_hasta'       , typeName:'time'                      },
        ],
        primaryKey: [idper.name,'dds'],
        foreignKeys: [
            {references: 'personas', fields:[idper.name], onDelete:'cascade'},
        ],
        constraints: [
            {constraintType: 'check', consName:'dia de la semana entre 0 y 6', expr: 'dds between 0 and 6'},
        ]
    };
}
