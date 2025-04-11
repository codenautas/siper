"use strict"

import { TableDefinition } from "backend-plus";

export function archivos_borrar():TableDefinition{
    const td:TableDefinition = {
        editable: true,
        name: 'archivos_borrar',
        fields: [
            {name:'ruta_archivo', typeName:'text',},
        ],
        primaryKey: ['ruta_archivo'],
    }
    return td
}