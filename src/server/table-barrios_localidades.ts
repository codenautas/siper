"use strict";

import {TableDefinition, TableContext, FieldDefinition, soloDigitosCons, soloDigitosPostConfig} from "./types-principal";

import { comuna_partido } from "./table-comunas_partidos";
import { provincia } from "./table-provincias";

export const barrio_localidad:FieldDefinition = {
    name: 'barrio_localidad', 
    typeName: 'text', 
    postInput: soloDigitosPostConfig
}

export function barrios_localidades(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'barrios_localidades',
        elementName: 'barrio_localidad',
        editable: admin,
        fields: [
            provincia,
            comuna_partido,
            barrio_localidad,
            {name: 'nombre', typeName:'text'  , isName: true  }
        ],
        primaryKey: [provincia.name, comuna_partido.name, barrio_localidad.name],
        constraints: [
            soloDigitosCons(provincia.name),
            soloDigitosCons(comuna_partido.name),
            soloDigitosCons(barrio_localidad.name),
        ],
        foreignKeys: [
            {references:'provincias', fields:[provincia.name]},
            {references:'comunas_partidos', fields:[provincia.name, comuna_partido.name]}
        ],
        detailTables: [
        ]
    }
};
