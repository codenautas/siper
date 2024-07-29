"use strict";

import {TableDefinition, TableContext, soloDigitosCons} from "./types-principal";

export function motivos(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'motivos',
        elementName: 'novedad',
        editable:admin,
        fields:[
            {name: 'motivo'      , typeName: 'text'   ,                    },
            {name: 'novedad'     , typeName: 'text'   , isName: true       },
            {name: 'dimension'   , typeName: 'text'   , title: 'dimensión' },
            {name: 'c_dds'       , typeName: 'boolean', description:'especifica el día de la semana'},
        ],
        primaryKey:['motivo'],
        constraints:[
            {constraintType:'unique', fields:['motivo','c_dds']},
            {constraintType:'check' , expr:'c_dds is not false', consName:'c_dds si o vacio'},
            soloDigitosCons('motivo'),
        ],
        foreignKeys:[
            {references: 'dimensiones', fields:['dimension']}
        ],
        detailTables:[
            {table:'novedades'         , fields:['motivo'], abr:'N'},
            {table:'registro_novedades', fields:['motivo'], abr:'R'},
            {table:'nov_per'           , fields:['motivo'], abr:'#'},
            {table:'mot_gru'           , fields:['motivo', 'dimension'], abr:'g'}
        ]
    };
}
