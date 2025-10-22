"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas, soloCodigo} from "./types-principal";

export const tipo_novedad:FieldDefinition = {
    name: 'tipo_novedad', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function tipos_novedad(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'tipos_novedad',
        elementName: 'tipo de novedad registrada',
        title:'tipos de novedades registradas',
        editable: admin,
        fields: [
            tipo_novedad,
            {name: 'descripcion'   , typeName: 'text'   , title: 'descripción' },
            {name: 'orden'         , typeName: 'integer'},
        ],
        lookupFields: ['orden', 'descripcion'],
        primaryKey: [tipo_novedad.name],
        constraints: [
            soloCodigo(tipo_novedad.name),
            {constraintType:'unique', consName:'orden de tipo de novedades', fields:['orden', tipo_novedad.name]},
        ]
    }
};
