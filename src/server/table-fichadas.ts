"use strict";

import {TableDefinition, TableContext, FieldDefinition} from "./types-principal";

import {idper} from "./table-personas"
import {fecha} from "./table-fechas"
import {año} from "./table-annios"

export const id_fichada: FieldDefinition = {
    name: 'id_fichada',
    typeName: 'bigint', 
    editable:false,
}

export function fichadas(_context: TableContext): TableDefinition{
    return {
        name: 'fichadas',
        elementName: 'fichada',
        editable: false,
        fields:[
            idper,
            fecha,
            {name: 'hora',             typeName: 'time'                                       },
            {...id_fichada, sequence:{ firstValue:101, name:'id_fichada_seq' }                },
            año,
            {name: 'tipo_fichada',     typeName: 'text'                                       },
            {name: 'observaciones',    typeName: 'text'                                       },
            {name: 'punto',            typeName: 'text'                                       },
            {name: 'tipo_dispositivo', typeName: 'text'                                       },
            {name: 'id_original',      typeName: 'text'                                       },
        ],         
        primaryKey: [idper.name, 'fecha', 'hora', id_fichada.name],
        foreignKeys: [
            {references: 'personas', fields: [idper.name], displayFields:['apellido', 'nombres', 'cuil', 'ficha']},
            {references: 'fechas'  , fields: [fecha.name]},
            {references: 'annios'  , fields: [año.name], onUpdate: 'no action'},
        ]
    };
}
