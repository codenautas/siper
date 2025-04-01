"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas, soloCodigo} from "./types-principal";

export const tipo_domicilio:FieldDefinition = {
    name: 'tipo_domicilio', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function tipos_domicilio(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'tipos_domicilio',
        elementName: 'tipo_domicilio',
        editable: admin,
        fields: [
            tipo_domicilio,
            {name: 'domicilio',typeName:'text'    },
            {name: 'orden'    ,typeName:'integer' },
        ],
        primaryKey: [tipo_domicilio.name],
        constraints: [
            soloCodigo(tipo_domicilio.name)
        ],
        detailTables: [
        ]
    }
};
