"use strict";

import {TableDefinition, TableContext } from "./types-principal";


export function modalidades_trabajo(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'modalidades_trabajo',
        elementName: 'modalidad_trabajo',
        editable: admin,
        fields: [
            {name: 'modalidad'  ,typeName:'text'    },
            {name: 'nombre'     ,typeName:'text', isName:true    },
        ],
        primaryKey: ['modalidad'],
        detailTables:[
            {table: 'usuarios', fields:[{source:'modalidad', target:'modalidad_trabajo'}], abr:'P'}
        ]
    }
};
