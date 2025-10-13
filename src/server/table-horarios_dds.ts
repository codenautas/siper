"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {horario} from "./table-horarios"

export function horarios_dds(context: TableContext): TableDefinition{
    return {
        name: 'horarios_dds',
        title: 'horarios por día de semana',
        editable: context.forDump,
        fields: [
            horario,
            {name: 'dds'              , typeName: 'integer'                   },
            {name: 'hora_desde'       , typeName: 'time'    , nullable:false  },
            {name: 'hora_hasta'       , typeName: 'time'    , nullable:false  },
            {name: 'trabaja'          , typeName: 'boolean' , nullable:false  },
        ],
        primaryKey: [horario.name, 'dds'],
        foreignKeys: [
            {references: 'horarios', fields:[horario.name], onDelete: 'cascade'},
        ],
        constraints: [
            {constraintType: 'check', consName: 'dia de la semana entre 0 y 6', expr: 'dds between 0 and 6'},
            {constraintType: 'check', consName: 'si trabaja tiene horario', expr: '(trabaja is true) = (hora_desde is not null and hora_hasta is not null)'},
        ]
    };
}
