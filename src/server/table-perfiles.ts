"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

export const perfil: FieldDefinition = {
    name: 'perfil',
    typeName: 'integer',
    title: 'Perfil SGC'
};

export function perfiles(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name:'perfiles',
        elementName: 'perfil',
        title:'Perfil SGC',
        editable:admin,
        fields:[
            perfil,
            {name: 'nombre'      , typeName: 'text', isName: true  },
            {name: 'objetivo'    , typeName: 'text'},
        ],
        primaryKey:[perfil.name],
        constraints:[
        ],
        detailTables:[
            {table:'personas'       , fields:[perfil.name], abr:'P'},
        ]
    };
}
