"use strict";

import { TableDefinition, TableContext, FieldDefinition, sinMinusculas } from "./types-principal";

export const jerarquia:FieldDefinition = {
    name : 'jerarquia',
    typeName : 'text',
    postInput : sinMinusculas
}

export function jerarquias(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name : 'jerarquias',
        elementName : 'jerarquia',
        editable : admin,
        fields: [
            jerarquia,
            {name: 'jerarquia_agip', typeName:'text'},
            {name: 'descripcion', typeName:'text'},
        ],
        primaryKey: ['jerarquia'],
        constraints: [
        ],
        detailTables: [
        ]
    }
}