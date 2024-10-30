"use strict";

import {TableDefinition, TableContext} from "./types-principal";

export function parametros(context: TableContext): TableDefinition {
    var admin = context.user.rol==='admin';
    return {
        name: 'parametros',
        editable: admin,
        fields:[
            {name: 'unico_registro'              , typeName: 'boolean', editable: false                                },
            {name: 'fecha_actual'                , typeName: 'date'   , nullable: false                                }, // solo se va a cambiar en modo test
            {name: 'horario_habitual_desde'      , typeName: 'time'                                                    },
            {name: 'horario_habitual_hasta'      , typeName: 'time'                                                    },
            {name: 'cod_nov_habitual'            , typeName: 'text', title: 'cód nov', description: 'código de novedad'},
        ],
        primaryKey: ['unico_registro'],
        foreignKeys: [
        ],
        constraints: [
            {constraintType: 'check', expr: 'unico_registro is true'}
        ]
    };
}
