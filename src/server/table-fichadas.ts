"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"

export const idf: FieldDefinition = {name: 'idf', typeName: 'bigint', description: 'identificador de la fichada'}

export function fichadas(_context: TableContext): TableDefinition{
    return {
        name: 'fichadas',
        elementName: 'fichada',
        editable: false,
        fields:[
            {...idf, sequence:{name:'idf_seq', firstValue:1001}, nullable:true, editable:false},
            idper,
            {name: 'fecha'  , typeName: 'date'                                                },
            {name: 'hora'   , typeName: 'time'                                                },
            {name: 'origen' , typeName: 'text'                                                },
        ],         
        primaryKey: [idf.name],
        foreignKeys: [
            {references: 'personas', fields: [idper.name], displayFields:['apellido', 'nombres', 'cuil', 'ficha']},
        ],
        hiddenColumns: [idf.name],
    };
}
