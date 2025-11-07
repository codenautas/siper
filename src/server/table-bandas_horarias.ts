"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas, soloMayusculas, soloCodigo} from "./types-principal";

export const banda_horaria:FieldDefinition = {
    name: 'banda_horaria', 
    typeName: 'text', 
    postInput: sinMinusculas
}

export function bandas_horarias(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'bandas_horarias',
        elementName: 'banda_horaria',
        editable: admin,
        fields: [
            banda_horaria,
            {name: 'descripcion',                 typeName:'text', isName:true     },
            {name: 'hora_desde' ,                 typeName:'time', nullable:false  },
            {name: 'hora_hasta' ,                 typeName:'time', nullable:false  },
            {name: 'umbral_aviso_falta_entrada' , typeName:'integer'               },
            {name: 'umbral_aviso_falta_salida'  , typeName:'integer'               },
        ],
        primaryKey: ['banda_horaria'],
        constraints: [
            soloCodigo(banda_horaria.name),
            soloMayusculas(banda_horaria.name),
        ],
        detailTables: [
            {table:'personas'          , fields:[banda_horaria.name], abr:'P'},
        ]
    }
};
