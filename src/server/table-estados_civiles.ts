"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas} from "./types-principal";

export const estado_civil:FieldDefinition = {
    name: 'estado_civil', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function estados_civiles(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'estados_civiles',
        elementName: 'estado_civil',
        editable: admin,
        fields: [
            estado_civil,
            {name: 'estadoagip',typeName:'integer' },
            {name: 'descripcion',typeName:'text' },
        ],
        primaryKey: ['estado_civil'],
        constraints: [
        ],
        detailTables: [
        ]
    }
};
