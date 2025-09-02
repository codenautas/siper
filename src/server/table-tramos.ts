"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas} from "./types-principal";

export const tramo:FieldDefinition = {
    name: 'tramo', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function tramos(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'tramos',
        elementName: 'tramo',
        editable: admin,
        fields: [
            tramo,
            {name: 'descripcion',typeName:'text', isName: true},
        ],
        primaryKey: ['tramo'],
        constraints: [
        ],
        detailTables: [
            {table:'personas'                       , fields:[tramo.name], abr:'P'},
            {table:'trayectoria_laboral'            , fields:[tramo.name], abr:'H'},
        ]
    }
};
