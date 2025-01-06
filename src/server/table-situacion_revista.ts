"use strict";

import {FieldDefinition, TableDefinition, TableContext, soloMayusculas, sinMinusculasNiAcentos} from "./types-principal";

export const s_revista: FieldDefinition = {
    name: 'situacion_revista', 
    typeName: 'text', 
    title: 'situación de revista', 
    postInput: sinMinusculasNiAcentos
};

export function situacion_revista(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'situacion_revista',
        elementName: 'situación de revista',
        title:'situación de revista',
        editable:admin,
        fields:[
            s_revista,
            {name: 'codigo_agip' ,typeName:'integer' },
            {name: 'con_novedad', typeName: 'boolean', description: 'si permite registrar una novedad' },
        ],
        primaryKey:[s_revista.name],
        constraints:[
            soloMayusculas(s_revista.name),
        ],
        detailTables:[
            {table:'personas'       , fields:[s_revista.name], abr:'P'},
        ]
    };
}
