"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas} from "./types-principal";

export const tramo:FieldDefinition = {
    name: 'tramo', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function tramos(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'tramos',
        elementName: 'tramo',
        editable: admin,
        fields: [
            tramo,
            {name: 'descripcion',typeName:'text' },
        ],
        primaryKey: ['tramo'],
        constraints: [
        ],
        detailTables: [
            {table:'personas'                       , fields:[tramo.name], abr:'P'},
            {table:'historial_contrataciones'       , fields:[tramo.name], abr:'H'},
        ]
    }
};
