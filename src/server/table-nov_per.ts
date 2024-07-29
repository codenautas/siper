"use strict";

import {TableDefinition, TableContext} from "./types-principal";

export function nov_per(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'nov_per',
        title: 'cantidad de novedades por persona',
        editable:admin,
        fields:[
            {name: 'annio'       , typeName: 'integer', title:'año'      },
            {name: 'novedad'     , typeName: 'text'   ,                  },
            {name: 'cuil'        , typeName: 'text'   ,                  },
            {name: 'cantidad'    , typeName: 'integer',                  },
        ],
        primaryKey:['annio', 'novedad', 'cuil'],
        softForeignKeys:[
            {references:'personal'     , fields:['cuil'   ]},
            {references:'motivos', fields:['novedad']},
        ],
        detailTables:[
            {table:'novedades', fields:['annio','novedad','cuil'], abr:'N'}
        ],
        sql:{
            isTable:false,
            from:`(
                select extract(year from fecha) as annio, novedad, cuil, count(*) as cantidad
                    from novedades
                    group by extract(year from fecha), novedad, cuil
            )`
        }
    };
}
