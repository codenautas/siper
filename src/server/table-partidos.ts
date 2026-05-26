"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas} from "./types-principal";

import {provincia} from "./table-provincias";

export const partido:FieldDefinition = {
    name: 'partido', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function partidos(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'partidos',
        elementName: 'partido',
        editable: admin,
        fields: [
            provincia,
            partido,
            {name: 'nombre_partido', typeName:'text'  , isName: true  },
        ],
        primaryKey: [provincia.name, partido.name],
        constraints: [
            {constraintType: 'check', consName: "provincia dos digitos", expr: `provincia similar to '\\d{2}'`},
            {constraintType: 'check', consName: "partido tres digitos", expr: `partido similar to '\\d{3}'`}
        ],
        foreignKeys: [
            {references:'provincias', fields:[provincia.name]}
        ],
        detailTables: [
        ]
    }
};
