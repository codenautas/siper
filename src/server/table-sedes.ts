"use strict";

import {TableDefinition, TableContext, FieldDefinition, soloCodigo} from "./types-principal";

export const sede:FieldDefinition = {
    name: 'sede', 
    typeName: 'text', 
}

export function sedes(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'sedes',
        elementName: 'sede',
        editable: admin,
        fields: [
            sede,
            {name: 'descripcion'      ,typeName:'text'   },
            {name: 'para_presencial'  ,typeName:'boolean'},
            {name: 'punto'            ,typeName:'point'  , editable:false},
        ],
        primaryKey: ['sede'],
        constraints: [
            soloCodigo(sede.name)
        ],
        detailTables: [
        ]
    }
};
