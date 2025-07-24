"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

export const puesto: FieldDefinition = {
    name: 'puesto', 
    typeName: 'integer',
    title: 'Perfil SGC'
};

export function puestos(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name:'puestos',
        elementName: 'puesto',
        title:'puestos',
        editable:admin,
        fields:[
            puesto,
            {name: 'nombre'      , typeName: 'text', isName: true  },
            {name: 'objetivo'    , typeName: 'text'},
        ],
        primaryKey:[puesto.name],
        constraints:[
        ],
        detailTables:[
            {table:'personas'       , fields:[puesto.name], abr:'P'},
        ]
    };
}
