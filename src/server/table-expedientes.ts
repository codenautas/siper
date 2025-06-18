"use strict";

import {FieldDefinition, TableDefinition, TableContext, soloMayusculas, sinMinusculasNiAcentos} from "./types-principal";

export const expediente: FieldDefinition = {
    name: 'expediente', 
    typeName: 'text', 
    postInput: sinMinusculasNiAcentos
};

export function expedientes(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'expedientes',
        elementName: 'expediente',
        title:'expedientes',
        editable:admin,
        fields:[
            expediente,
            {name: 'cod_2024'   , typeName: 'integer'},
        ],
        primaryKey:[expediente.name],
        constraints:[
            soloMayusculas(expediente.name),
        ],
        detailTables:[
            {table:'personas'       , fields:[expediente.name], abr:'P'},
        ]
    };
}
