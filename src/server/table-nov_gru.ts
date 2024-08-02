"use strict";

import {TableDefinition, TableContext} from "./types-principal";

export function nov_gru(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'nov_gru',
        title: 'cantidad de novedades por persona',
        editable:admin,
        fields:[
            {name: 'annio'       , typeName: 'integer', title: 'año'       },
            {name: 'cod_nov'      , typeName: 'text'   ,                    },
            {name: 'clase'   , typeName: 'text'   , title: 'dimensión' },
            {name: 'grupo'       , typeName: 'text'   ,                    },
            {name: 'minimo'      , typeName: 'integer', title: 'mínimo'    },
            {name: 'maximo'      , typeName: 'integer', title: 'máximo'    },
        ],
        primaryKey:['annio', 'cod_nov', 'clase', 'grupo'],
        foreignKeys:[
            {references:'cod_nov'       , fields:['cod_nov'            ]},
            {references:'grupos'        , fields:['clase', 'grupo' ]},
        ],
        detailTables:[
            // {table:'novedades', fields:['annio','cod_nov','cuil'], abr:'N'}
        ]
    };
}
