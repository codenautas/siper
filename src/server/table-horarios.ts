"use strict";

import {TableDefinition, TableContext, soloDigitosCons} from "./types-principal";

import {cuil} from "./table-personal"

export function horarios(context: TableContext): TableDefinition{
    var admin = context.user.rol==='admin' || context.user.rol==='rrhh';
    return {
        name: 'horarios',
        elementName: 'horario',
        title: 'Horarios del personal',
        editable: admin,
        fields: [
            {...cuil, editable:admin},
            {name:'dds'              , typeName:'integer'                   },
            {name:'trabaja'          , typeName:'boolean' , nullable:false ,defaultValue:false},
            {name:'hora_desde'       , typeName:'text'                      },
            {name:'hora_hasta'       , typeName:'text'                      },
        ],
        primaryKey: [cuil.name,'dds'],
        foreignKeys: [
            {references: 'personal', fields:[cuil.name]},
        ],
        constraints: [
            {constraintType: 'check', consName:'dia de la semana entre 0 y 6', expr: 'dds between 0 and 6'},
            soloDigitosCons(cuil.name),
        ]
    };
}
