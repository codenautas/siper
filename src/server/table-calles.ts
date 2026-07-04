"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas, soloDigitosCons} from "./types-principal";

import {provincia} from "./table-provincias";

export const calle:FieldDefinition = {
    name: 'calle', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function calles(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'calles',
        elementName: 'calle',
        editable: admin,
        fields: [
            provincia,
            calle,
            {name: 'nombre_calle'    , typeName:'text'  , isName: true  },
            {name: 'cod_2024'        , typeName:'text'    },
        ],
        primaryKey: [provincia.name, calle.name],
        constraints: [
            soloDigitosCons(provincia.name),
            soloDigitosCons(calle.name)
        ],
        foreignKeys: [
            {references:'provincias', fields:[provincia.name]}
        ],
        detailTables: [
        ]
    }
};
