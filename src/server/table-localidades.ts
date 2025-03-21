"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas, soloCodigo} from "./types-principal";

import {provincia} from "./table-provincias";

export const localidad:FieldDefinition = {
    name: 'localidad', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function localidades(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
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
            soloCodigo(provincia.name),
            soloCodigo(localidad.name)
        ],
        foreignKeys: [
            {references:'provincias', fields:[provincia.name]}
        ],
        detailTables: [
        ]
    }
};
