"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {cod_nov} from "./table-cod_novedades";
// import {fecha} from "./table-fechas";

export function parametros(context: TableContext): TableDefinition {
    var admin = context.es.admin;
    return {
        name: 'parametros',
        editable: admin,
        fields:[
            {name: 'unico_registro'              , typeName: 'boolean', editable: false                                },
            {name: 'fecha_hora_para_test'        , typeName: 'timestamp'                                               }, // solo se va a cambiar en modo test
            {name: 'cod_nov_habitual'            , typeName: 'text'   , title: 'cód nov', description: 'código de novedad'},
            {name: 'permite_cargar_fichadas'     , typeName: 'boolean', title: 'permite registrar fichadas', description: 'Si está en Sí habilita la carga de fichadas, caso contrario no', defaultDbValue:'true'},
        ],
        primaryKey: ['unico_registro'],
        foreignKeys: [
            {references: 'cod_novedades', fields: [{source: 'cod_nov_habitual', target:cod_nov.name}]},
        ],
        constraints: [
            {constraintType: 'check', expr: 'unico_registro is true'},
            {constraintType: 'check', expr: 'permite_cargar_fichadas is not false'}
        ]
    };
}
