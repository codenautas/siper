"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas} from "./types-principal";

export const pais:FieldDefinition = {
    name: 'pais', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function paises(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'paises',
        elementName: 'pais',
        editable: admin,
        fields: [
            pais,
            {name: 'codigoagip',typeName:'text' },
            {name: 'nombre_pais',typeName:'text' },
            {name: 'gentilicio',typeName:'text' },
            {name: 'orden',typeName:'integer' },
        ],
        primaryKey: ['pais'],
        constraints: [
        ],
        detailTables: [
        ]
    }
};
