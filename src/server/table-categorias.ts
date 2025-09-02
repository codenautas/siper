"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas} from "./types-principal";

export const categoria:FieldDefinition = {
    name: 'categoria', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function categorias(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'categorias',
        elementName: 'categoria',
        editable: admin,
        fields: [
            categoria,
            {name: 'descripcion',typeName:'text' , isName: true},
        ],
        primaryKey: ['categoria'],
        constraints: [
        ],
        detailTables: [
            {table:'personas'                       , fields:[categoria.name], abr:'P'},
            {table:'trayectoria_laboral'            , fields:[categoria.name], abr:'H'},
        ]
    }
};
