"use strict";

import {TableDefinition, TableContext} from "./types-principal";
import {annio} from "./table-annios"
import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades"
import {sector} from "./table-sectores"
import { sqlNovPer } from "./table-nov_per";

export function nov_per_abierto(_context: TableContext): TableDefinition {
    return {
        name:'nov_per_abierto',
        title: 'descanso anual remunerado abierto por año origen',
        editable: false,
        fields:[
            annio,
            idper,
            sector,
            cod_nov,
            {name: 'origen'         , typeName: 'text'   },
            {name: 'cantidad'       , typeName: 'integer'},
            {name: 'usados'         , typeName: 'integer', description: 'días pedidos que ya fueron tomados'}, 
            {name: 'pendientes'     , typeName: 'integer', description: 'días pedidos que todavía no ocurrieron'},
            {name: 'saldo'          , typeName: 'integer', description: 'días restantes bajo el supuesto que los pendientes se tomarán según fueron pedidos'},
            {name: 'suma_cantidad'  , typeName: 'integer'},
            {name: 'suma_usados'    , typeName: 'integer'}, 
            {name: 'suma_pendientes', typeName: 'integer'},
            {name: 'suma_saldo'     , typeName: 'integer'},
            {name: 'detalle'        , typeName: 'text', clientSide: 'detalle_dias'},
            {name: 'detalle_multiorigen', typeName: 'jsonb'},
            {name: 'novedad'            , typeName: 'text' },
        ],
        primaryKey: [annio.name, cod_nov.name, idper.name],
        softForeignKeys: [
            {references: 'annios'       , fields: [annio.name]},
            {references: 'personas'     , fields: [idper.name], displayFields:['apellido', 'nombres']},
            {references: 'sectores'     , fields: [sector.name]},
            {references: 'cod_novedades', fields: [cod_nov.name]},
        ],
        detailTables: [
            {table:'novedades_vigentes', fields:[annio.name, idper.name, cod_nov.name], abr:'D'}
        ],
        sql: {
            isTable:false,
            from:`(SELECT annio, origen, x.idper, /*apellido, nombres,*/
                	x.sector,
                    abierto_cantidad as cantidad,
                    coalesce(abierto_usados,0) as usados,
                    coalesce(abierto_pendientes,0) as pendientes,
                    coalesce(abierto_saldo,0) as saldo,
                    cantidad as suma_cantidad,
                    usados as suma_usados,
                    pendientes as suma_pendientes,
                    saldo as suma_saldo,
                    cod_nov,
                    novedad,
                    detalle_multiorigen
                    FROM (${sqlNovPer({abierto:true})}) x
                        LEFT JOIN personas p ON p.idper = x.idper  
                    WHERE cod_nov = '1'
                    ORDER BY 1,3,2,4
            )`
        },
        hiddenColumns: ['detalle', 'detalle_multiorigen', 'cod_nov'],
    };
}
