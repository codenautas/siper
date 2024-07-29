"use strict";

import {TableDefinition, TableContext, soloCodigo} from "./types-principal";

export function dimensiones(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'dimensiones',
        elementName: 'dimensión',
        editable:admin,
        fields:[
            {name: 'dimension'   , typeName: 'text'   ,                 },
            {name: 'nombre'      , typeName: 'text'   , isName:true   , },
        ],
        primaryKey:['dimension'],
        constraints:[
            {constraintType:'unique', fields:['nombre']},
            soloCodigo('dimension'),
        ],
        detailTables:[
            {table:'grupos'            , fields:['dimension'], abr:'g'},
        ]
    };
}
