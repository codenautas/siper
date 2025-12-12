"use strict";

import {TableDefinition, TableContext, FieldDefinition} from "./types-principal";

import {idper} from "./table-personas"

//no importo los fields porque si cambian las definiciones puede afectar al funcionamiento 
//de la empresa que ingresa en esta tabla

export const id_fichada: FieldDefinition = {
    name: 'id_fichada',
    typeName: 'bigint', 
    editable:false,
}

export function fichadas_recibidas(context: TableContext): TableDefinition{
    return {
        name: 'fichadas_recibidas',
        elementName: 'fichada_recibida',
        editable: context.forDump,
        fields:[
            {name: 'idper'            , typeName: 'text', nullable: false       },
            {name: 'fecha'            , typeName: 'date', nullable: false       },
            {name: 'hora'             , typeName: 'time', nullable: false       },
            {name: 'tipo'             , typeName: 'text', nullable: false       },
            {name: 'texto'            , typeName: 'text'                        },
            {name: 'dispositivo'      , typeName: 'text'                        },
            {name: 'punto_gps'        , typeName: 'text'                        },
            {name: 'id_originen'      , typeName: 'text'                        },
        ],         
        primaryKey: ['idper', 'fecha', 'hora'],
        foreignKeys: [
            {references: 'personas', fields: [{source:'idper', target:idper.name}], displayFields:['apellido', 'nombres', 'cuil', 'ficha']},
        ]
    };
}
