"use strict";

import {TableDefinition, TableContext, idImportacion} from "./types-principal";
import {annio} from "./table-annios";
import {categoria} from "./table-categorias";
import {cod_nov} from "./table-cod_novedades";

export function nov_per_importado(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name:'nov_per_importado',
        /* tabla temporaria que permite importar desde un Excel externo */
        editable:admin,
        fields:[
            idImportacion,
            /* Estos campos no deben cambiarse aunque cambien los originales */
            annio,
            {name: 'ficha'    , typeName: 'text', nullable:false, allowEmptyText:true, title:'Ficha'                     },
            {name: 'cuil'     , typeName: 'text', nullable:false, allowEmptyText:true, title:'Cuil'                      },
            {name: 'idmeta4'  , typeName: 'text', nullable:false, allowEmptyText:true, title:'id meta4'                  },
            categoria,
            {name: 'nomyape'  , typeName: 'text', nullable:false, allowEmptyText:true, title:'Nombre y Apellido'         },
            {name: 'sector'   , typeName: 'text', nullable:false, allowEmptyText:true, title:'Sector'                    },
            {name: 'motivo'   , typeName: 'text', nullable:false, allowEmptyText:true, title:'Código'                    },
            {name: 'novedad'  , typeName: 'text', nullable:false, allowEmptyText:true, title:'novedad'                    },
            {name: 'cantidad' , typeName: 'text', nullable:false, allowEmptyText:true, title:'Cantidad'                  },
        ],
        primaryKey: [idImportacion.name],
        foreignKeys: [
            {references: 'annios', fields:[annio.name]},
            {references: 'categorias', fields:[categoria.name]},
            {references: 'cod_novedades', fields: [{source: 'novedad', target:cod_nov.name}]}
        ],

    };
}
