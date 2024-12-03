"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas} from "./types-principal";

import {modalidad} from "./table-capa_modalidades";

export const capacitacion:FieldDefinition = {
    name: 'capacitacion', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export const tipo:FieldDefinition = {
    name: 'tipo', 
    typeName: 'text'
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
            capacitacion,
            modalidad,
            {name: 'tipo',typeName:'text' },
            {name: 'puntos',typeName:'integer' },
            {name: 'duracion',typeName:'text' },
            {name: 'dictado_por',typeName:'text' },
            {name: 'fecha_inicio',typeName:'date' },
            {name: 'fecha_fin',typeName:'date' },
        ],
        primaryKey: [capacitacion.name, modalidad.name, 'tipo', 'fecha_inicio'],
        foreignKeys: [
            {references:'capa_modalidades', fields:[modalidad.name]}
        ],
        constraints: [
        ],
        detailTables: [
            {table:'per_capa'   , fields:[capacitacion.name, modalidad.name, tipo.name, fecha_inicio.name], abr:'P'},
        ]
    };
}