"use strict";

import {FieldDefinition, TableDefinition, TableContext, soloDigitosCons, soloDigitosPostConfig} from "./types-principal";

import {clase} from "./table-clases";

export const cod_nov: FieldDefinition = {
    name: 'cod_nov', 
    typeName: 'text', 
    title: 'cód nov', 
    description: 'código de novedad', 
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
            {name: 'total'       , typeName: 'boolean',                                             },
            {name: 'parcial'     , typeName: 'boolean',                                             },
            {name: 'con_horario' , typeName: 'boolean', description:'la novedad puede usarse en el horario de las personas'},
            {name: 'con_novedad' , typeName: 'boolean', description:'la novedad puede usarse en el registro de novedades'},
            {name: 'corridos'    , typeName: 'boolean', description:'días corridos (incluye feriados y fines de semana)'},
            {name: 'registra'    , typeName: 'boolean', description:'novedades que pueden ser registradas por los registras'},
            {name: 'prioritario' , typeName: 'boolean', description:'aparecen en la lista reducida'},
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
            {table:'novedades_horarias'   , fields:[cod_nov.name], abr:'H'},
            {table:'nov_per'           , fields:[cod_nov.name], abr:'#'},
            {table:'nov_gru'           , fields:[cod_nov.name, clase.name], abr:'g'}
        ]
    };
}
