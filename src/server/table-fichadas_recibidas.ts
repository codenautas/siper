"use strict";

import {TableDefinition, TableContext, FieldDefinition} from "./types-principal";

//no importo los fields porque si cambian las definiciones puede afectar al funcionamiento 
//de la empresa que ingresa en esta tabla

export const id_fichada: FieldDefinition = {
    name: 'id_fichada',
    typeName: 'bigint', 
    editable: false,
}

export function fichadas_recibidas(context: TableContext): TableDefinition{
    return {
        name: 'fichadas_recibidas',
        elementName: 'fichada_recibida',
        editable: context.forDump,
        fields:[
            {...id_fichada            , sequence:{name: 'id_fichada', firstValue: 100}},
            {name: 'fichador'         , typeName: 'text'     , nullable: false        },
            {name: 'fecha'            , typeName: 'date'     , nullable: false        },
            {name: 'hora'             , typeName: 'time'     , nullable: false        },
            {name: 'tipo'             , typeName: 'text'     , nullable: false        },
            {name: 'texto'            , typeName: 'text'     , allowEmptyText: true   },
            {name: 'dispositivo'      , typeName: 'text'     , allowEmptyText: true   },
            {name: 'punto_gps'        , typeName: 'text'     , allowEmptyText: true   },
            {name: 'id_origen'        , typeName: 'text'     , allowEmptyText: true   },
            {name: 'recepcion'        , typeName: 'timestamp', defaultDbValue: 'current_timestamp'},
            {name: 'migrado_estado'   , typeName: 'text'     , defaultDbValue: 'current_timestamp'},
            {name: 'migrado_log'      , typeName: 'text'     , nullable: false, defaultDbValue: "'pendiente'"}
        ],         
        primaryKey: [id_fichada.name],
        sql:{
            skipEnance: true
        }
    };
}
