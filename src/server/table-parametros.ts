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
            {name: 'unico_registro'              , typeName: 'boolean', editable: false, title:'U°R', description:'único registro' },
            {name: 'fecha_hora_para_test'        , typeName: 'timestamp'                                                           }, // solo se va a cambiar en modo test
            {name: 'cod_nov_habitual'            , typeName: 'text'   , title: 'cód nov', description: 'código de novedad habitual'},
            {name: 'permite_cargar_fichadas'     , typeName: 'boolean', description: 'Si está en Sí habilita la carga de fichadas, caso contrario no', defaultDbValue:'true'},
            {name: 'carga_nov_hasta_hora'        , typeName: 'time'   , nullable:false, defaultValue:'12:00', description: 'hora hasta la cuál se pueden cargar novedaees'}
        ],
        primaryKey: ['unico_registro'],
        foreignKeys: [
            {references: 'cod_novedades', fields: [{source: 'cod_nov_habitual', target:cod_nov.name}]},
        ],
        constraints: [
            {constraintType: 'check', expr: 'unico_registro is true'},
            {constraintType: 'check', expr: 'permite_cargar_fichadas is not false'}
        ],
        hiddenColumns:['unico_registro']
    };
}
