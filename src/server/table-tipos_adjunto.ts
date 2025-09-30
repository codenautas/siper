"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas, soloCodigo} from "./types-principal";

export const tipo_adjunto:FieldDefinition = {
    name: 'tipo_adjunto', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function tipos_adjunto(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'tipos_adjunto',
        elementName: 'tipo_adjunto',
        editable: admin,
        fields: [
            tipo_adjunto,
            {name: 'descripcion',typeName:'text' },
        ],
        primaryKey: ['tipo_adjunto'],
        constraints: [
            soloCodigo(tipo_adjunto.name)
        ],
        detailTables: [
            {table: 'tipos_adjunto_atributos', fields: ['tipo_adjunto'], abr:'A'}
        ]
    }
};