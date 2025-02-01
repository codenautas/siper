"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {cod_nov} from "./table-cod_novedades";

export function parametros(context: TableContext): TableDefinition {
    var admin = context.user.rol==='admin';
    return {
        name: 'parametros',
        editable: admin,
        fields:[
            {name: 'unico_registro'              , typeName: 'boolean', editable: false                                },
            {name: 'fecha_actual'                , typeName: 'date'   , nullable: false                                }, // solo se va a cambiar en modo test
            {name: 'cod_nov_habitual'            , typeName: 'text'   , title: 'cód nov', description: 'código de novedad'},
            {name: 'avance_dia_automatico'       , typeName: 'boolean', title: 'avance día automático', description: 'Debe ser Sí. El día se avanza automáticamente. Puede estear en No solo en programas de test'},
        ],
        primaryKey: ['unico_registro'],
        foreignKeys: [
            {references: 'cod_novedades', fields: [{source: 'cod_nov_habitual', target:cod_nov.name}]}
        ],
        constraints: [
            {constraintType: 'check', expr: 'unico_registro is true'}
        ]
    };
}
