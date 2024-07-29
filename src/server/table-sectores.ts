"use strict";

import {TableDefinition, TableContext} from "./types-principal";

export function sectores(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'sectores',
        elementName:'sector',
        editable:admin,
        fields:[
            {name: 'sector'          , typeName: 'text',              title:'sector'                   },
            {name: 'nombre_sector'   , typeName: 'text', isName:true, title:'sector departamento área' },
        ],
        primaryKey:['sector'],
        detailTables:[
            {table:'personal', fields:['sector'], abr:'P'}
        ]
    };
}
