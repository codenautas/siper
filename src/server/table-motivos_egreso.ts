"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas, soloCodigo} from "./types-principal";

export const motivo_egreso:FieldDefinition = {
    name : 'motivo_egreso',
    typeName: 'text',
    postInput: sinMinusculas
}

export function motivos_egreso(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name : 'motivos_egreso',
        elementName : 'motivo_egreso',
        editable : admin,
        fields: [
            motivo_egreso,
            {name: 'cod_2024',typeName:'integer' },
            {name: 'descripcion',typeName:'text' },
        ],
        primaryKey: ['motivo_egreso'],
        constraints: [
            soloCodigo(motivo_egreso.name),
        ],
        detailTables: [
        ]
    }
};