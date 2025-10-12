"use strict";

import {TableDefinition, TableContext} from "./types-principal";

//import {idper} from "./table-personas"
//import {año} from "./table-annios"

export function horarios_dds(context: TableContext): TableDefinition{
    var admin = context.es.rrhh;
    return {
        name: 'horarios_dds',
        elementName: 'horario_dds',
        title: 'horarios dia',
        editable: admin,
        fields: [
            {name:'horario'          , typeName:'text'                    },
            {name:'dds'              , typeName:'integer'                 },
            {name:'hora_desde'       , typeName:'time'    , nullable:false},
            {name:'hora_hasta'       , typeName:'time'    , nullable:false},
            {name:'trabaja'          , typeName:'boolean' , nullable:false , defaultValue:false},
        ],
        primaryKey: ['horario','dds'],
        foreignKeys: [
           //va fk contra la nueva referencial de horarios
        ],
        constraints: [
            {constraintType: 'check', consName:'dia de la semana entre 0 y 6', expr: 'dds between 0 and 6'},
            {constraintType: 'check', consName:'si trabaja tiene horario', expr: '(trabaja is true) = (hora_desde is not null and hora_hasta is not null)'},
        ]
    };
}
