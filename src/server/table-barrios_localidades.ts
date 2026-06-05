"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas} from "./types-principal";

import { comuna_partido } from "./table-comunas_partidos";
import { provincia } from "./table-provincias";

export const barrio_localidad:FieldDefinition = {
    name: 'barrio_localidad', 
    typeName: 'text', 
    postInput: sinMinusculas
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
            {constraintType: 'check', consName: "provincia dos digitos", expr: `provincia similar to '\\d{2}'`},
            {constraintType: 'check', consName: "comuna_partido tres digitos", expr: `comuna_partido similar to '\\d{3}'`},
            {constraintType: 'check', consName: "barrio_localidad tres a cinco digitos", expr: `barrio_localidad similar to '\\d{3,5}'`}
        ],
        foreignKeys: [
            {references:'provincias', fields:[provincia.name]},
            {references:'comunas_partidos', fields:[provincia.name, comuna_partido.name]}
        ],
        detailTables: [
        ]
    }
};
