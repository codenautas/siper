"use strict";

import {TableDefinition, TableContext, FieldDefinition, soloDigitosCons, soloDigitosPostConfig} from "./types-principal";

import {provincia} from "./table-provincias";

export const comuna_partido:FieldDefinition = {
    name: 'comuna_partido',
    typeName: 'text',
    postInput: soloDigitosPostConfig
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
            soloDigitosCons(provincia.name),
            soloDigitosCons(comuna_partido.name),
            soloDigitosCons('comuna_carto'),
        ],
        foreignKeys: [
            {references:'provincias', fields:[provincia.name]}
        ],
        detailTables: [
            {table: 'barrio_localidades', fields:[provincia.name, comuna_partido.name], abr:'b'}
        ]
    }
};
