"use strict";

import {TableDefinition, TableContext, soloCodigo} from "./types-principal";

export function clases(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'clases',
        elementName: 'dimensión',
        editable:admin,
        fields:[
            {name: 'clase'   , typeName: 'text'   ,                 },
            {name: 'nombre'      , typeName: 'text'   , isName:true   , },
        ],
        primaryKey:['clase'],
        constraints:[
            {constraintType:'unique', fields:['nombre']},
            soloCodigo('clase'),
        ],
        detailTables:[
            {table:'grupos'            , fields:['clase'], abr:'g'},
        ]
    };
}
