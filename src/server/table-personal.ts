"use strict";

import {TableDefinition, TableContext, soloDigitosCons} from "./types-principal";

export function personal(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'personal',
        elementName:'persona',
        editable:admin,
        fields:[
            {name: 'cuil'     , typeName: 'text',              title:'CUIL'                      },
            {name: 'ficha'    , typeName: 'text', isName:true,                                   },
            {name: 'idmeta4'  , typeName: 'text', isName:true, title:'id meta4'                  },
            {name: 'nomyape'  , typeName: 'text', isName:true, title:'nombre y apellido'         },
            {name: 'sector'   , typeName: 'text',                                                },
            {name: 'categoria', typeName: 'text',              title:'categoría'                 },
        ],
        primaryKey:['cuil'],
        constraints:[
            soloDigitosCons('cuil'   ),
            soloDigitosCons('ficha'  ),
            soloDigitosCons('idmeta4'),
        ],
        detailTables:[
            {table:'novedades'         , fields:['cuil'], abr:'N'},
            {table:'registro_novedades', fields:['cuil'], abr:'R'},
            {table:'nov_per'           , fields:['cuil'], abr:'#'}
        ]
    };
}
