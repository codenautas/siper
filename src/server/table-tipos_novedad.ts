"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas, soloCodigo} from "./types-principal";

export const tipo_novedad_verificado = 'V';
export const tipo_novedad_inicial = 'I';

export const tipo_novedad:FieldDefinition = {
    name: 'tipo_novedad', 
    typeName: 'text', 
    title: 'tipo',
    postInput: sinMinusculas,
}

export function tipos_novedad(context:TableContext):TableDefinition{
    return {
        name: 'tipos_novedad',
        elementName: 'tipo de novedad registrada',
        title:'tipos de novedades registradas',
        editable: context.forDump,
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
