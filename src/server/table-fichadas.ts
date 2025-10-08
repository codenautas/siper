"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {fecha} from "./table-fechas"

export function fichadas(_context: TableContext): TableDefinition{
    return {
        name: 'fichadas',
        elementName: 'fichada',
        editable: false,
        fields:[
            idper,
            {name: 'tipo_fichada', typeName: 'text', nullable: true                           },
            fecha,
            {name: 'hora'   , typeName: 'time'                                                },
            //{name: 'origen' , typeName: 'text'                                                },
            {name: 'observaciones', typeName: 'text', nullable: true                          },
            {name: 'punto', typeName: 'text', nullable: true                                  },
            {name: 'tipo_dispositivo', typeName: 'text', nullable: true                       },
            {name: 'id_original', typeName: 'text', nullable: true                            },
        ],         
        primaryKey: [idper.name, 'fecha', 'hora'],
        foreignKeys: [
            {references: 'personas', fields: [idper.name], displayFields:['apellido', 'nombres', 'cuil', 'ficha']},
            {references: 'fechas'  , fields: [fecha.name]},
        ]
    };
}
