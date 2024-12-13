"use strict";

import {TableDefinition, TableContext, FieldDefinition} from "./types-principal";

export const genero:FieldDefinition = {
    name: 'genero', 
    typeName: 'integer', 
}

export function generos(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'generos',
        elementName: 'genero',
        editable: admin,
        fields: [
            genero,
            {name: 'descripcion',typeName:'text' },
        ],
        primaryKey: ['genero'],
        constraints: [
        ],
        detailTables: [
        ]
    }
};
