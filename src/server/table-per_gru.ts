"use strict";

import {TableDefinition, TableContext} from "./types-principal";

export function per_gru(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'per_gru',
        elementName: 'persona-grupo',
        editable:admin,
        fields:[
            {name: 'cuil'        , typeName: 'text'   ,                 },
            {name: 'dimension'   , typeName: 'text'   ,                 },
            {name: 'grupo'       , typeName: 'text'   ,                 },
        ],
        primaryKey:['cuil', 'dimension'],
        foreignKeys:[
            {references:'personal'       , fields:['cuil']              , displayAllFields:true},
            {references:'grupos'         , fields:['dimension', 'grupo'], displayAllFields:true},
        ]
    };
}
