"use strict";

import {TableDefinition, TableContext} from "./types-principal";

export function mot_gru(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'mot_gru',
        title: 'cantidad de novedades por persona',
        editable:admin,
        fields:[
            {name: 'annio'       , typeName: 'integer', title: 'año'       },
            {name: 'motivo'      , typeName: 'text'   ,                    },
            {name: 'dimension'   , typeName: 'text'   , title: 'dimensión' },
            {name: 'grupo'       , typeName: 'text'   ,                    },
            {name: 'minimo'      , typeName: 'integer', title: 'mínimo'    },
            {name: 'maximo'      , typeName: 'integer', title: 'máximo'    },
        ],
        primaryKey:['annio', 'motivo', 'dimension', 'grupo'],
        foreignKeys:[
            {references:'motivos'       , fields:['motivo'            ]},
            {references:'grupos'        , fields:['dimension', 'grupo' ]},
        ],
        detailTables:[
            // {table:'novedades', fields:['annio','motivo','cuil'], abr:'N'}
        ]
    };
}
