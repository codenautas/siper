"use strict";

import {TableDefinition, TableContext, FieldDefinition} from "./types-principal";

export const horario: FieldDefinition = {
    name: 'horario', 
    typeName: 'text', 
}

export function horarios(context: TableContext): TableDefinition{
    return {
        name: 'horarios',
        elementName: 'horario',
        title: 'horarios del personal',
        editable: context.forDump,
        fields: [
            horario
        ],
        primaryKey: [horario.name],
    };
}
