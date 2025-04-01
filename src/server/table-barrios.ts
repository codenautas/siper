"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas} from "./types-principal";

import {provincia} from "./table-provincias";

export const barrio:FieldDefinition = {
    name: 'barrio', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function barrios(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'barrios',
        elementName: 'barrio',
        editable: admin,
        fields: [
            provincia,
            barrio,
            {name: 'nombre_barrio'   , typeName:'text'  , isName: true  },
            {name: 'cod_2024'        , typeName:'text'    },
        ],
        primaryKey: [provincia.name, barrio.name],
        constraints: [
            {constraintType: 'check', consName: "provincia dos digitos", expr: `provincia similar to '\\d{2}'`},
            {constraintType: 'check', consName: "barrio uno o dos digitos", expr: `barrio similar to '\\d{1,2}'`}
        ],
        foreignKeys: [
            {references:'provincias', fields:[provincia.name]}
        ],
        detailTables: [
        ]
    }
};
