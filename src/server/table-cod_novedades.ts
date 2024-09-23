"use strict";

import {FieldDefinition, TableDefinition, TableContext, soloDigitosCons, soloDigitosPostConfig} from "./types-principal";

import {clase} from "./table-clases";

export const cod_nov: FieldDefinition = {
    name: 'cod_nov', 
    typeName: 'text', 
    title: 'cód nov', 
    description: 'códiog de novedad', 
    postInput: soloDigitosPostConfig
};

export function cod_novedades(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'cod_novedades',
        elementName: 'código de novedad',
        title:'códigos de novedades',
        editable:admin,
        fields:[
            cod_nov,
            {name: 'novedad'     , typeName: 'text'   , isName: true       },
            clase,
            {name: 'c_dds'       , typeName: 'boolean', description:'especifica el día de la semana'},
            {name: 'con_detalles', typeName: 'boolean',                                             },
        ],
        primaryKey:[cod_nov.name],
        constraints:[
            {constraintType:'unique', fields:[cod_nov.name,'c_dds']},
            {constraintType:'check' , expr:'c_dds is not false', consName:'c_dds si o vacio'},
            soloDigitosCons(cod_nov.name),
        ],
        foreignKeys:[
            {references: 'clases', fields:[clase.name]}
        ],
        detailTables:[
            {table:'novedades_vigentes'   , fields:[cod_nov.name], abr:'N'},
            {table:'novedades_registradas', fields:[cod_nov.name], abr:'R'},
            {table:'nov_per'           , fields:[cod_nov.name], abr:'#'},
            {table:'nov_gru'           , fields:[cod_nov.name, clase.name], abr:'g'}
        ]
    };
}
