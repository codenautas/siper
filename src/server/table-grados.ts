"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas} from "./types-principal";

import {tramo} from "./table-tramos";

export const grado:FieldDefinition = {
    name: 'grado', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function grados(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'grados',
        elementName: 'grado',
        editable: admin,
        fields: [
            tramo,
            grado,
            {name: 'descripcion',typeName:'text' },
        ],
        primaryKey: [tramo.name, grado.name],
        foreignKeys: [
            {references: 'tramos'  , fields: [tramo.name]},
        ],
        constraints: [
        ],
        detailTables: [
        ]
    }
};
