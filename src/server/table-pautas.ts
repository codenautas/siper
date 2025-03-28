"use strict";

import {FieldDefinition, TableDefinition, TableContext, soloCodigo} from "./types-principal";

export const pauta: FieldDefinition = {
    name: 'pauta', 
    typeName: 'text', 
    description: 'código de pauta de inconsistencia', 
    postInput: 'upperWithoutDiacritics' 
};

export function pautas(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'pautas',
        elementName: 'pauta',
        title:'pautas de inconsistencias',
        editable:admin,
        fields:[
            pauta,
            {name: 'descripcion' , typeName: 'text'   , isName: true, title: ' descripción'         },
        ],
        primaryKey:[pauta.name],
        constraints:[
            soloCodigo(pauta.name),
        ],
        detailTables:[
            {table:'inconsistencias'      , fields:[pauta.name], abr:'I'},
        ]
    };
}
