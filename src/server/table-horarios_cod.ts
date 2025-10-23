"use strict";

import {TableDefinition, TableContext, FieldDefinition} from "./types-principal";

export const horario: FieldDefinition = {
    name: 'horario', 
    typeName: 'text', 
}

export function horarios_cod(context: TableContext): TableDefinition{
    return {
        name: 'horarios_cod',
        elementName: 'código de horario',
        title: 'códigos de horario',
        editable: context.forDump,
        fields: [
            horario
        ],
        primaryKey: [horario.name],
        sql:{
            skipEnance: true
        },
    };
}
