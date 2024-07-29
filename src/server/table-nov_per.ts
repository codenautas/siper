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
            {name: 'motivo'      , typeName: 'text'   ,                  },
            {name: 'cuil'        , typeName: 'text'   ,                  },
            {name: 'cantidad'    , typeName: 'integer',                  },
        ],
        primaryKey: ['annio', 'motivo', 'cuil'],
        softForeignKeys: [
            {references: 'personal'     , fields: ['cuil'   ]},
            {references: 'motivos'      , fields: ['motivo']},
        ],
        detailTables: [
            {table:'novedades', fields:['annio','motivo','cuil'], abr:'N'}
        ],
        sql: {
            isTable:false,
            from:`(
                select extract(year from fecha) as annio, motivo, cuil, count(*) as cantidad
                    from novedades
                    group by extract(year from fecha), motivo, cuil
            )`
        }
    };
}
