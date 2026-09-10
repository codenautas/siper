"use strict";

import {TableDefinition, TableContext, FieldDefinition, soloCodigo} from "./types-principal";

export const id_punto:FieldDefinition = {
    name: 'id_punto', 
    typeName: 'text', 
}

export const cod_sede:FieldDefinition = {
    name: 'cod_sede', 
    typeName: 'text',
    title: 'cod_sede',
}

export function sedes(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'sedes',
        elementName: 'sede',
        editable: admin,
        fields: [
            id_punto,
            cod_sede,
            {name: 'punto_alternativo',typeName:'boolean'},
            {name: 'descripcion'      ,typeName:'text'   },
            {name: 'para_presencial'  ,typeName:'boolean'},
            {name: 'punto'            ,typeName:'point'  },
        ],
        primaryKey: [id_punto.name],
        constraints: [
            {constraintType:'unique', fields:[cod_sede.name]},
            soloCodigo(id_punto.name)
        ],
        detailTables: [
        ]
    }
};
