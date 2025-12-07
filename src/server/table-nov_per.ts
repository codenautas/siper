"use strict";
import * as sqlTools from 'sql-tools';

import {TableDefinition, TableContext} from "./types-principal";
import {annio} from "./table-annios"
import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades"
import {sector} from "./table-sectores"

export const sqlNovPer = (params:{idper?:string, annio?:number, abierto?:boolean, annioAbierto?:boolean})=>{
    var filtroAño = (alias:string) => params.annioAbierto 
        ? `(CASE WHEN cn.inicializacion = 'LICORD' THEN ${alias}.annio in (select annio from annios where abierto) ELSE ${alias}.annio = a.annio END)` 
        : `${alias}.annio = a.annio`;
    return `
    select -- ${params.annioAbierto ? '' : 'a.annio,'}
            a.annio,
            ${params.abierto ? `origen, 
            apertura.cantidad as abierto_cantidad,
            apertura.usados as abierto_usados,
            apertura.pendientes as abierto_pendientes,
            apertura.saldo as abierto_saldo,` : ''}
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
            nv.saldo < 0 as error_saldo_negativo,
            detalle_multiorigen,
            fch.error_falta_entrada
    from cod_novedades cn
    left join lateral (
        select p.idper, cd.cod_nov, true as error_falta_entrada from novedades_vigentes nv
        left join personas p on nv.idper = p.idper
        left join fichadas f on  f.idper = p.idper and f.fecha = nv.fecha
        left join cod_novedades cd on nv.cod_nov = cd.cod_nov
        where cd.requiere_entrada and f.hora is null
        group by p.idper, cd.cod_nov
    ) fch on cn.cod_nov = fch.cod_nov,
        parametros par,
        annios a,
        personas p,
        lateral (
            select sum(cantidad) as cantidad,
                    json_object_agg(origen, json_build_object('cantidad', cantidad) order by origen)::text as esquema                    
                from per_nov_cant pnc
                where pnc.cod_nov = cn.cod_nov and pnc.idper = p.idper and ${filtroAño('pnc')}
        ) pnc,
        lateral (
            select 
                    count(*) filter (where nv.fecha <= fecha_actual()) as usados, 
                    count(*) filter (where nv.fecha > fecha_actual()) as pendientes, 
                    pnc.cantidad - count(*) as saldo, 
                    detalle_nov_multiorigen(
                        array_agg(nv.fecha order by nv.fecha), 
                        (select     
                            jsonb_object_agg(origen, jsonb_build_object('cantidad', cantidad) order by origen) 
                            from per_nov_cant pnc 
                            where pnc.cod_nov = cn.cod_nov and ${filtroAño('pnc')} and pnc.idper = p.idper
                        )::text
                    )::jsonb as detalle_multiorigen
                from novedades_vigentes nv
                where nv.cod_nov = cn.cod_nov and nv.idper = p.idper and ${filtroAño('nv')}
        ) nv
        ${params.abierto ? ` , lateral (select * from jsonb_populate_recordset(
            null::detalle_novedades_multiorigen, 
            nv.detalle_multiorigen -> 'detalle'
        )) apertura` : ``}
        where true 
            ${params.annio ? ` and a.annio = ${sqlTools.quoteLiteral(params.annio)} `:''}
            ${params.idper ? ` and p.idper = ${sqlTools.quoteLiteral(params.idper)} `:''}
`};

export function nov_per(_context: TableContext): TableDefinition {
    return {
        name:'nov_per',
        title: 'cantidad de novedades por persona',
        editable: false,
        fields:[
            annio,
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
            from:`(select *
                   from (${sqlNovPer({})}) x
                   where con_dato
            )`
        },
        hiddenColumns: ['esquema', 'detalle'],
    };
}
