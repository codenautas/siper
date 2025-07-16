"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas, soloCodigo} from "./types-principal";

export const estado_civil:FieldDefinition = {
    name: 'estado_civil', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function estados_civiles(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'estados_civiles',
        elementName: 'estado_civil',
        editable: admin,
        fields: [
            estado_civil,
            {name: 'descripcion',typeName:'text'    },
            {name: 'cod_2024'   ,typeName:'integer' },
        ],
        primaryKey: ['estado_civil'],
        constraints: [
            soloCodigo(estado_civil.name)
        ],
        detailTables: [
        ]
    }
};
