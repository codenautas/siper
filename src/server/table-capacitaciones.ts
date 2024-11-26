"use strict";

import {TableDefinition, TableContext, FieldDefinition} from "./types-principal";

export const capacitacion:FieldDefinition = {
    name: 'capacitacion', 
    typeName: 'text', 
    postInput: 'upperWithoutDiacritics'
}

export const modalidad:FieldDefinition = {
    name: 'modalidad', 
    typeName: 'text', 
    postInput: 'upperWithoutDiacritics'
}

export const tipo:FieldDefinition = {
    name: 'tipo', 
    typeName: 'text', 
    postInput: 'upperWithoutDiacritics'
}

export const fecha_inicio:FieldDefinition = {
    name: 'fecha_inicio', 
    typeName: 'date', 
}

export function capacitaciones(context: TableContext): TableDefinition{
    var admin = context.user.rol==='admin' || context.user.rol==='rrhh';
    return {
        name: 'capacitaciones',
        elementName: 'capacitacion',
        title: 'capacitaciones',
        editable: admin,
        fields: [
            {name: 'capacitacion',typeName:'text' },
            {name: 'modalidad',typeName:'text' },
            {name: 'tipo',typeName:'text' },
            {name: 'puntos',typeName:'integer' },
            {name: 'duracion',typeName:'text' },
            {name: 'dictado_por',typeName:'text' },
            {name: 'fecha_inicio',typeName:'date' },
            {name: 'fecha_fin',typeName:'date' },
        ],
        primaryKey: ['capacitacion', 'modalidad', 'tipo', 'fecha_inicio'],
        foreignKeys: [
        ],
        constraints: [
        ],
        detailTables: [
            {table:'per_capa'   , fields:[capacitacion.name, modalidad.name, tipo.name, fecha_inicio.name], abr:'P'},
        ]
    };
}