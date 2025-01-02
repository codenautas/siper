"use strict";

import {TableDefinition, TableContext, FieldDefinition} from "./types-principal";

export const sexo:FieldDefinition = {
    name: 'sexo', 
    typeName: 'text', 
}

export function sexos(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'sexos',
        elementName: 'sexo',
        editable: admin,
        fields: [
            sexo,
            {name: 'descripcion',typeName:'text' },
        ],
        primaryKey: ['sexo'],
        constraints: [
        ],
        detailTables: [
        ]
    }
};
