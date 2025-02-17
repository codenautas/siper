"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas, soloCodigo} from "./types-principal";

export const tipo_sec:FieldDefinition = {
    name: 'tipo_sec', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function tipos_sec(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'tipos_sec',
        elementName: 'tipo_sec',
        editable: admin,
        fields: [
            tipo_sec,
            {name: 'descripcion'   , typeName: 'text'   , title: 'descripción' },
            {name: 'nivel'         , typeName: 'integer', isName:true, description: 'Nivel dentro de la jerarquía.' },
        ],
        primaryKey: [tipo_sec.name],
        constraints: [
            soloCodigo(tipo_sec.name)
        ],
        detailTables: [
            {table:'sectores_edit', fields:[tipo_sec.name], abr:'S'}
        ]
    }
};
