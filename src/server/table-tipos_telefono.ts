"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas, soloCodigo} from "./types-principal";

export const tipo_telefono:FieldDefinition = {
    name: 'tipo_telefono', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function tipos_telefono(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'tipos_telefono',
        elementName: 'tipo_telefono',
        editable: admin,
        fields: [
            tipo_telefono,
            {name: 'descripcion', typeName:'text', isName:true    },
            {name: 'orden'      , typeName:'integer' },
        ],
        primaryKey: [tipo_telefono.name],
        constraints: [
            soloCodigo(tipo_telefono.name)
        ],
        detailTables: [
        ]
    }
};
