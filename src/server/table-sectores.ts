"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

export const sector: FieldDefinition = {name: 'sector', typeName: 'text', title:'sector'}

export function sectores(context: TableContext): TableDefinition {
    var admin = context.user.rol==='admin';
    return {
        name: 'sectores',
        elementName: 'sector',
        editable: admin,
        fields: [
            sector,
            {name: 'nombre_sector', typeName: 'text', isName:true, title:'sector departamento área'},
        ],
        primaryKey: [sector.name],
        detailTables: [
            {table:'personal', fields:[sector.name], abr:'P'}
        ]
    };
}
