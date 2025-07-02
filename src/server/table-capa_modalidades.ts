"use strict";

import {TableDefinition, TableContext, FieldDefinition} from "./types-principal";

export const modalidad:FieldDefinition = {
    name: 'modalidad', 
    typeName: 'text'
}

export function capa_modalidades(context: TableContext): TableDefinition{
    var admin = context.es.admin || context.es.rrhh;
    return {
        name: 'capa_modalidades',
        elementName: 'modalidad',
        title: 'modalidades de las capacitaciones',
        editable: admin,
        fields: [
            modalidad,
            {name: 'observaciones', typeName:'text'}
        ],
        primaryKey: ['modalidad'],
        detailTables: [
            {table:'capacitaciones'   , fields:[modalidad.name], abr:'C'},
        ]
    };
}