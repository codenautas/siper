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
            horario,
            {name:'cant_horas'    , typeName:'integer', description:'cantidad de horas especiales'},
            {name:'horas_promedio', typeName:'integer', description:'horas promedio diarias del horario'},
        ],
        primaryKey: [horario.name],
        sql:{
            skipEnance: true
        },
    };
}
