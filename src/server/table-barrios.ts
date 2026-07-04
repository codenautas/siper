"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas, soloDigitosCons} from "./types-principal";

import {provincia} from "./table-provincias";

export const barrio:FieldDefinition = {
    name: 'barrio', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function barrios(context:TableContext):TableDefinition{
    var admin = context.es.admin;
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
            soloDigitosCons(provincia.name),
            soloDigitosCons(barrio.name)
        ],
        foreignKeys: [
            {references:'provincias', fields:[provincia.name]}
        ],
        detailTables: [
        ]
    }
};
