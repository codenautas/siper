"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas} from "./types-principal";

export const provincia:FieldDefinition = {
    name: 'provincia', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function provincias(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'provincias',
        elementName: 'provincia',
        editable: admin,
        fields: [
            provincia,
            {name: 'nombre_provincia', typeName:'text'  , isName: true  },
            {name: 'cod_2024'        , typeName:'text'    },
        ],
        primaryKey: [provincia.name],
        constraints: [
            {constraintType: 'check', consName: "provincia dos digitos", expr: `provincia similar to '\\d{2}'`}
        ],
        detailTables: [
            {table:'barrios'    , fields:[provincia.name], abr:'B'},
            {table:'localidades', fields:[provincia.name], abr:'L'},
        ]
    }
};
