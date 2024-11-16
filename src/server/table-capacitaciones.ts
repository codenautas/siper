"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {año} from "./table-annios"

export function capacitaciones(context: TableContext): TableDefinition{
    var admin = context.user.rol==='admin' || context.user.rol==='rrhh';
    return {
        name: 'capacitaciones',
        elementName: 'capacitacion',
        title: 'capacitaciones',
        editable: admin,
        fields: [
            {...idper, editable:admin},
            {...año, editable:false},
            {name: 'estudio',typeName:'text' },
            {name: 'tipo',typeName:'text' },
            {name: 'puntos',typeName:'integer' },
            {name: 'duracion',typeName:'text' },
            {name: 'dictado_por',typeName:'text' },
        ],
        primaryKey: [idper.name, año.name, 'estudio'],
        foreignKeys: [
            {references: 'personas', fields:[idper.name], onDelete:'cascade'},
            {references: 'annios'  , fields: [año.name], onUpdate: 'no action'},
        ],
        constraints: [
        ]
    };
}