"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"

export function fichadas(_context: TableContext): TableDefinition{
    return {
        name: 'fichadas',
        elementName: 'fichada',
        editable: false,
        fields:[
            idper,
            {name: 'fecha'  , typeName: 'date'                                                },
            {name: 'hora'   , typeName: 'time'                                                },
            {name: 'origen' , typeName: 'text'                                                },
        ],         
        primaryKey: [idper.name, 'fecha', 'hora'],
        foreignKeys: [
            {references: 'personas', fields: [idper.name], displayFields:['apellido', 'nombres', 'cuil', 'ficha']},
        ]
    };
}
