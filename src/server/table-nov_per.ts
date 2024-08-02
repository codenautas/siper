"use strict";

import {TableDefinition, TableContext} from "./types-principal";

export function nov_per(context: TableContext): TableDefinition {
    var admin = context.user.rol==='admin';
    return {
        name:'nov_per',
        title: 'cantidad de novedades por persona',
        editable:admin,
        fields:[
            {name: 'annio'       , typeName: 'integer', title:'año'      },
            {name: 'cod_nov'      , typeName: 'text'   ,                  },
            {name: 'cuil'        , typeName: 'text'   ,                  },
            {name: 'cantidad'    , typeName: 'integer',                  },
        ],
        primaryKey: ['annio', 'cod_nov', 'cuil'],
        softForeignKeys: [
            {references: 'personal'     , fields: ['cuil'   ]},
            {references: 'cod_nov'      , fields: ['cod_nov']},
        ],
        detailTables: [
            {table:'novedades', fields:['annio','cod_nov','cuil'], abr:'N'}
        ],
        sql: {
            isTable:false,
            from:`(
                select extract(year from fecha) as annio, cod_nov, cuil, count(*) as cantidad
                    from novedades
                    group by extract(year from fecha), cod_nov, cuil
            )`
        }
    };
}
