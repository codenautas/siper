"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas} from "./types-principal";

import {provincia} from "./table-provincias";

export const comuna_partido:FieldDefinition = {
    name: 'comuna_partido',
    typeName: 'text',
    postInput: sinMinusculas
}

export function comunas_partidos(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'comunas_partidos',
        elementName: 'comuna_partido',
        editable: admin,
        fields: [
            provincia,
            comuna_partido,
            {name: 'nombre', typeName:'text'  , isName: true  },
            {name: 'comuna_carto', typeName:'text'            },
        ],
        primaryKey: [provincia.name, comuna_partido.name],
        constraints: [
            {constraintType: 'check', consName: "provincia dos digitos", expr: `provincia similar to '\\d{2}'`},
            {constraintType: 'check', consName: "comuna_partido tres digitos", expr: `comuna_partido similar to '\\d{3}'`},
            {constraintType: 'check', consName: "comuna_carto tres digitos", expr: `comuna_carto similar to '\\d{3}'`}
        ],
        foreignKeys: [
            {references:'provincias', fields:[provincia.name]}
        ],
        detailTables: [
        ]
    }
};
