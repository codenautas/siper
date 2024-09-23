"use strict";

import {TableDefinition, TableContext, idImportacion} from "./types-principal";

export function nov_per_importado(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'nov_per_importado',
        /* tabla temporaria que permite importar desde un Excel externo */
        editable:admin,
        fields:[
            idImportacion,
            /* Estos campos no deben cambiarse aunque cambien los originales */
            {name: 'annio'    , typeName: 'text', nullable:false, allowEmptyText:true, title:'Año'                       },
            {name: 'ficha'    , typeName: 'text', nullable:false, allowEmptyText:true, title:'Ficha'                     },
            {name: 'cuil'     , typeName: 'text', nullable:false, allowEmptyText:true, title:'Cuil'                      },
            {name: 'idmeta4'  , typeName: 'text', nullable:false, allowEmptyText:true, title:'id meta4'                  },
            {name: 'categoria', typeName: 'text', nullable:false, allowEmptyText:true, title:'Categoría'                 },
            {name: 'nomyape'  , typeName: 'text', nullable:false, allowEmptyText:true, title:'Nombre y Apellido'         },
            {name: 'sector'   , typeName: 'text', nullable:false, allowEmptyText:true, title:'Sector'                    },
            {name: 'motivo'   , typeName: 'text', nullable:false, allowEmptyText:true, title:'Código'                    },
            {name: 'novedad'  , typeName: 'text', nullable:false, allowEmptyText:true, title:'novedad'                    },
            {name: 'cantidad' , typeName: 'text', nullable:false, allowEmptyText:true, title:'Cantidad'                  },
        ],
        primaryKey: [idImportacion.name],
    };
}
