"use strict";

import {FieldDefinition, TableDefinition, TableContext, sinMinusculas} from "./types-principal";

export const funcion: FieldDefinition = {
    name: 'funcion', 
    typeName: 'text', 
    postInput: sinMinusculas
};

export function funciones(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'funciones',
        elementName: 'funcion',
        title:'funciones',
        editable:admin,
        fields:[
            funcion,
            {name: 'descripcion', typeName: 'text'},
            {name: 'cod_2024'   , typeName: 'integer'},
        ],
        primaryKey:[funcion.name],
        constraints:[
            //soloCodigo(funcion.name),
        ],
        detailTables:[
            {table:'historial_contrataciones'       , fields:[funcion.name], abr:'H'},
        ]
    };
}
