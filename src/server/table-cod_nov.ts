"use strict";

import {TableDefinition, TableContext, soloDigitosCons} from "./types-principal";

export function cod_nov(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'cod_nov',
        elementName: 'código de novedad',
        title:'códigos de novedades',
        editable:admin,
        fields:[
            {name: 'cod_nov'     , typeName: 'text'   ,                    },
            {name: 'novedad'     , typeName: 'text'   , isName: true       },
            {name: 'clase'       , typeName: 'text'   , description:'la clase que determina los grupos que deben considerarse para los límites anuales de cada persona en cada grupo'},
            {name: 'c_dds'       , typeName: 'boolean', description:'especifica el día de la semana'},
        ],
        primaryKey:['cod_nov'],
        constraints:[
            {constraintType:'unique', fields:['cod_nov','c_dds']},
            {constraintType:'check' , expr:'c_dds is not false', consName:'c_dds si o vacio'},
            soloDigitosCons('cod_nov'),
        ],
        foreignKeys:[
            {references: 'clases', fields:['clase']}
        ],
        detailTables:[
            {table:'novedades'         , fields:['cod_nov'], abr:'N'},
            {table:'registro_novedades', fields:['cod_nov'], abr:'R'},
            {table:'nov_per'           , fields:['cod_nov'], abr:'#'},
            {table:'nov_gru'           , fields:['cod_nov', 'clase'], abr:'g'}
        ]
    };
}
