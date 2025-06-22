"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas} from "./types-principal";

export const agrupamiento:FieldDefinition = {
    name: 'agrupamiento', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function agrupamientos(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'agrupamientos',
        elementName: 'agrupamiento',
        editable: admin,
        fields: [
            agrupamiento,
            {name: 'descripcion',typeName:'text' },
        ],
        primaryKey: ['agrupamiento'],
        constraints: [
        ],
        detailTables: [
            {table:'personas'                       , fields:[agrupamiento.name], abr:'P'},
            {table:'historial_contrataciones'       , fields:[agrupamiento.name], abr:'H'},
        ]
    }
};
