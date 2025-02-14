"use strict";
import * as sqlTools from 'sql-tools';

import {TableDefinition, TableContext} from "./types-principal";
import {año} from "./table-annios"
import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades"
import {sector} from "./table-sectores"

export const sqlNovPer= (params:{idper?:string, annio?:number})=> `
    select pn.annio, cn.cod_nov, pn.idper, 
            pn.total, 
            count(*) filter (where fecha <= fecha_actual) as usados, 
            count(*) filter (where (coalesce(fecha,fecha_actual) <= fecha_actual) is not true) as pendientes, 
            pn.total - count(*) as disponibles,
            p.sector,
            pn.esquema
    from cod_novedades cn
        inner join parametros on unico_registro
        left join (
            select annio, idper, cod_nov, 
                    sum(cantidad) as total,
                    json_object_agg(origen, json_build_object('cantidad', cantidad) order by origen)::text as esquema
                from per_nov_cant 
                where true ${params.annio? ` and annio = ${sqlTools.quoteLiteral(params.annio)} `:' '}
                ${params.idper? ` and idper = ${sqlTools.quoteLiteral(params.idper)} `:' '}
                group by annio, idper, cod_nov
        ) pn on cn.cod_nov = pn.cod_nov
        left join novedades_vigentes n on pn.annio = n.annio and pn.idper = n.idper and pn.cod_nov = n.cod_nov
        left join personas p on pn.idper = p.idper
    group by pn.annio, cn.cod_nov, pn.idper, pn.total, p.sector, pn.esquema
`;

export function nov_per(_context: TableContext): TableDefinition {
    return {
        name:'nov_per',
        title: 'cantidad de novedades por persona',
        editable: false,
        fields:[
            año,
            idper,
            cod_nov,
            {name: 'total'       , typeName: 'integer'},
            {name: 'usados'      , typeName: 'integer', description: 'días pedidos que ya fueron tomados'}, 
            {name: 'pendientes'  , typeName: 'integer', description: 'días pedidos que todavía no ocurrieron'},
            {name: 'disponibles' , typeName: 'integer', description: 'días disponibles bajo el supuesto que los pendientes se tomarán según fueron pedidos'},
            {name: 'esquema'     , typeName: 'text'   },
            {name: 'detalle'     , typeName: 'text'   , clientSide: 'detalle_dias'},
            sector,
        ],
        primaryKey: [año.name, cod_nov.name, idper.name],
        softForeignKeys: [
            {references: 'annios'       , fields: [año.name]},
            {references: 'personas'     , fields: [idper.name], displayFields:['apellido', 'nombres']},
            {references: 'sectores'     , fields: [sector.name]},
            {references: 'cod_novedades', fields: [cod_nov.name]},
        ],
        detailTables: [
            {table:'novedades_vigentes', fields:[año.name, idper.name, cod_nov.name], abr:'D'}
        ],
        sql: {
            isTable:false,
            from:`(select *
                   from (${sqlNovPer({})}) x
            )`
        },
        hiddenColumns: ['esquema', 'detalle'],
    };
}
