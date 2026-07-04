"use strict";

import {TableDefinition, TableContext, FieldDefinition, soloDigitosCons, soloDigitosPostConfig} from "./types-principal";

export const provincia:FieldDefinition = {
    name: 'provincia', 
    typeName: 'text', 
    postInput: soloDigitosPostConfig
}

export function provincias(context:TableContext):TableDefinition{
    var admin = context.es.admin;
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
            soloDigitosCons(provincia.name)
        ],
        detailTables: [
            {table:'comunas_partidos'    , fields:[provincia.name], abr:'c'},
            {table:'barrios_localidades' , fields:[provincia.name], abr:'b'},
        ]
    }
};
