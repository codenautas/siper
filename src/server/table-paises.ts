"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas, soloCodigo} from "./types-principal";

export const pais:FieldDefinition = {
    name: 'pais', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function paises(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'paises',
        elementName: 'pais',
        editable: admin,
        fields: [
            pais,
            {name: 'nombre_pais', typeName:'text'  , isName: true  },
            {name: 'gentilicio' , typeName:'text'    },
            {name: 'orden'      , typeName:'integer' },
            {name: 'cod_2024'   , typeName:'text'    },
        ],
        primaryKey: ['pais'],
        constraints: [
            soloCodigo(pais.name)
        ],
        detailTables: [
        ]
    }
};
