"use strict";

import {TableDefinition, TableContext, soloCodigo} from "./types-principal";

export function grupos(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'grupos',
        elementName: 'grupo',
        editable:admin,
        fields:[
            {name: 'clase'       , typeName: 'text'   ,                 },
            {name: 'grupo'       , typeName: 'text'   ,                 },
            {name: 'descripcion' , typeName: 'text'   , isName:true     },
        ],
        primaryKey:['clase', 'grupo'],
        constraints:[
            {constraintType:'unique', fields:['descripcion']},
            soloCodigo('grupo'),
        ],
        detailTables:[
            {table:'per_gru'       , fields:['clase', 'grupo'], abr:'p'},
        ]
    };
}
