"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas} from "./types-principal";

export const tipodocumento:FieldDefinition = {
    name: 'tipodocumento', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function tipos_documento(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'tipos_documento',
        elementName: 'tipo_documento',
        editable: admin,
        fields: [
            tipodocumento,
            {name: 'documento',typeName:'text' },
        ],
        primaryKey: ['tipodocumento'],
        constraints: [
        ],
        detailTables: [
        ]
    }
};
