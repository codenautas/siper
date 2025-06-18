"use strict";

import {FieldDefinition, TableDefinition, TableContext, sinMinusculas, soloCodigo} from "./types-principal";

export const n_grado: FieldDefinition = {
    name: 'nivel_grado', 
    typeName: 'text', 
    postInput: sinMinusculas
};

export function nivel_grado(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'nivel_grado',
        elementName: 'nivel_grado',
        title:'nivel_grado',
        editable:admin,
        fields:[
            n_grado,
            {name: 'cod_2024'   , typeName: 'integer'},
        ],
        primaryKey:[nivel_grado.name],
        constraints:[
            soloCodigo(nivel_grado.name),
        ],
        detailTables:[
            {table:'personas'       , fields:[nivel_grado.name], abr:'P'},
        ]
    };
}
