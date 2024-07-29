"use strict";

import {TableDefinition, TableContext, soloDigitosCons} from "./types-principal";

export function motivos(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'motivos',
        elementName: 'motivo',
        editable:admin,
        fields:[
            {name: 'novedad'     , typeName: 'text'   ,                 },
            {name: 'motivo'      , typeName: 'text'   , isName:true   , },
            {name: 'c_dds'       , typeName: 'boolean', description:'especifica el día de la semana'},
        ],
        primaryKey:['novedad'],
        constraints:[
            {constraintType:'unique', fields:['novedad','c_dds']},
            {constraintType:'check' , expr:'c_dds is not false', consName:'c_dds si o vacio'},
            soloDigitosCons('novedad'),
        ],
        detailTables:[
            {table:'novedades'         , fields:['novedad'], abr:'N'},
            {table:'registro_novedades', fields:['novedad'], abr:'R'},
            {table:'nov_per'           , fields:['novedad'], abr:'#'}
        ]
    };
}
