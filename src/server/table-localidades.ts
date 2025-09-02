"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas} from "./types-principal";

import {provincia} from "./table-provincias";

export const localidad:FieldDefinition = {
    name: 'localidad', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function localidades(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'localidades',
        elementName: 'localidad',
        editable: admin,
        fields: [
            provincia,
            localidad,
            {name: 'nombre_localidad', typeName:'text'  , isName: true  },
            {name: 'cod_2024'        , typeName:'text'    },
        ],
        primaryKey: [provincia.name, localidad.name],
        constraints: [
            {constraintType: 'check', consName: "provincia dos digitos", expr: `provincia similar to '\\d{2}'`},
            {constraintType: 'check', consName: "localidad uno a tres digitos", expr: `localidad similar to '\\d{1,3}'`}
        ],
        foreignKeys: [
            {references:'provincias', fields:[provincia.name]}
        ],
        detailTables: [
        ]
    }
};
