"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas} from "./types-principal";

export const tipo_doc:FieldDefinition = {
    name: 'tipo_doc', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function tipos_doc(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'tipos_doc',
        elementName: 'tipo_doc',
        editable: admin,
        fields: [
            tipo_doc,
            {name: 'documento',typeName:'text' },
        ],
        primaryKey: ['tipo_doc'],
        constraints: [
        ],
        detailTables: [
        ]
    }
};
