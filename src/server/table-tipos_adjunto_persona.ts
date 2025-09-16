"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas, soloCodigo} from "./types-principal";

export const tipo_adjunto_persona:FieldDefinition = {
    name: 'tipo_adjunto_persona', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function tipos_adjunto_persona(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'tipos_adjunto_persona',
        elementName: 'tipo_adjunto_persona',
        editable: admin,
        fields: [
            tipo_adjunto_persona,
            {name: 'descripcion',typeName:'text' },
        ],
        primaryKey: ['tipo_adjunto_persona'],
        constraints: [
            soloCodigo(tipo_adjunto_persona.name)
        ],
        detailTables: [
            {table: 'tipos_adjunto_persona_atributos', fields: ['tipo_adjunto_persona'], abr:'A'}
        ]
    }
};