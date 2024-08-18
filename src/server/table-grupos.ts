"use strict";

import {FieldDefinition, TableDefinition, TableContext, soloCodigo} from "./types-principal";

import {clase} from "./table-clases";

export const grupo:FieldDefinition = {
    name: 'grupo', 
    typeName: 'text', 
    postInput: 'upperWithoutDiacritics'
}

export function grupos(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'grupos',
        elementName: 'grupo',
        editable: admin,
        fields: [
            clase,
            grupo,
            {name: 'descripcion', typeName: 'text', isName:true},
        ],
        primaryKey: [clase.name, grupo.name],
        foreignKeys: [
            {references: 'clases', fields: [clase.name]}
        ],
        constraints: [
            {constraintType: 'unique', fields: ['descripcion']},
            soloCodigo(grupo.name),
        ],
        detailTables: [
            {table: 'per_gru', fields: [clase.name, grupo.name], abr:'p'},
        ]
    };
}
