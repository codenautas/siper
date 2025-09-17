"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

export const perfil_sgc: FieldDefinition = {
    name: 'perfil_sgc', 
    typeName: 'integer',
    title: 'Perfil SGC'
};

export function perfiles_sgc(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name:'perfiles_sgc',
        elementName: 'perfil_sgc',
        title:'Perfil SGC',
        editable:admin,
        fields:[
            perfil_sgc,
            {name: 'nombre'      , typeName: 'text', isName: true  },
            {name: 'objetivo'    , typeName: 'text'},
        ],
        primaryKey:[perfil_sgc.name],
        constraints:[
        ],
        detailTables:[
            {table:'personas'       , fields:[perfil_sgc.name], abr:'P'},
        ]
    };
}
