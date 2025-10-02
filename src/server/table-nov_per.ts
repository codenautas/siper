"use strict";
import * as sqlTools from 'sql-tools';

import {TableDefinition, TableContext} from "./types-principal";
import {año} from "./table-annios"
import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades"
import {sector} from "./table-sectores"

export const sqlNovPer = (params:{idper?:string, annio?:number, abierto?:boolean})=> `
    select a.annio, 
            ${params.abierto ? 'origen, abierto.cantidad as abierto_cantidad,' : ''}
            cn.cod_nov, 
            p.idper, 
            p.sector,
            pnc.cantidad,
            nv.usados,
            nv.pendientes,
            nv.saldo,
            pnc.esquema,
            (pnc.cantidad > 0 or nv.usados > 0 or nv.pendientes > 0) as con_dato,
            cn.comun,
            cn.novedad,
            cn.c_dds,
            cn.con_detalles,
            cn.registra,
            cn.prioritario,
            nv.saldo < 0 as error_saldo_negativo
    from cod_novedades cn,
        parametros par,
        annios a,
        personas p,
        lateral (
            select sum(cantidad) as cantidad,
                    json_object_agg(origen, json_build_object('cantidad', cantidad) order by origen)::text as esquema
                from per_nov_cant pnc
                where pnc.cod_nov = cn.cod_nov and pnc.annio = a.annio and pnc.idper = p.idper
        ) pnc,
        lateral (
            select 
                    count(*) filter (where nv.fecha <= fecha_actual) as usados, 
                    count(*) filter (where nv.fecha > fecha_actual) as pendientes, 
                    pnc.cantidad - count(*) as saldo
                from novedades_vigentes nv
                where nv.cod_nov = cn.cod_nov and nv.annio = a.annio and nv.idper = p.idper
        ) nv
        ${params.abierto ? `, lateral (select origen, cantidad from per_nov_cant pnc where pnc.cod_nov = cn.cod_nov and pnc.annio = a.annio and pnc.idper = p.idper) abierto` : ``}
        where true 
            ${params.annio? ` and a.annio = ${sqlTools.quoteLiteral(params.annio)} `:''}
            ${params.idper? ` and p.idper = ${sqlTools.quoteLiteral(params.idper)} `:''}
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
            {name: 'cantidad'    , typeName: 'integer'},
            {name: 'usados'      , typeName: 'integer', description: 'días pedidos que ya fueron tomados'}, 
            {name: 'pendientes'  , typeName: 'integer', description: 'días pedidos que todavía no ocurrieron'},
            {name: 'saldo'       , typeName: 'integer', description: 'días restantes bajo el supuesto que los pendientes se tomarán según fueron pedidos'},
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
                   where con_dato
            )`
        },
        hiddenColumns: ['esquema', 'detalle'],
    };
}
