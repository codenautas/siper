"use strict";

import { TableDefinition, TableContext, FieldDefinition, sinMinusculas, soloCodigo } from "./types-principal";

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
            {name: 'descripcion', typeName:'text'},
            {name: 'cod_2024'   , typeName:'text'},
        ],
        primaryKey: ['jerarquia'],
        constraints: [
            soloCodigo(jerarquia.name),
        ],
        detailTables: [
        ]
    }
}