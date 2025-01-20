"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {año} from "./table-annios"
import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades"
import {sector} from "./table-sectores"

export function nov_per(_context: TableContext): TableDefinition {
    return {
        name:'nov_per',
        title: 'cantidad de novedades por persona',
        editable: false,
        fields:[
            idper,
            sector,
            año,
            cod_nov,
            {name: 'total'       , typeName: 'integer'},
            {name: 'usados'      , typeName: 'integer', description: 'días pedidos que ya fueron tomados'}, 
            {name: 'pendientes'  , typeName: 'integer', description: 'días pedidos que todavía no ocurrieron'},
            {name: 'disponibles' , typeName: 'integer', description: 'días disponibles bajo el supuesto que los pendientes se tomarán según fueron pedidos'},
            {name: 'esquema'     , typeName: 'text'   },
            {name: 'detalle'     , typeName: 'text'   , clientSide: 'detalle_dias'},
        ],
        primaryKey: [año.name, cod_nov.name, idper.name],
        softForeignKeys: [
            {references: 'annios'       , fields: [año.name]},
            {references: 'personas'     , fields: [idper.name], displayFields:['ficha', 'cuil', 'apellido', 'nombres']},
            {references: 'sectores'     , fields: [sector.name]},
        ],
        detailTables: [
            {table:'novedades_vigentes', fields:[año.name, idper.name, cod_nov.name], abr:'D'}
        ],
        sql: {
            isTable:false,
            from:`(
                select annio, cod_nov, idper, 
                        pn.total, 
                        count(*) filter (where fecha <= fecha_actual) as usados, 
                        count(*) filter (where (fecha <= fecha_actual) is not true) as pendientes, 
                        pn.total - count(*) as disponibles,
                        p.sector,
                        pn.esquema
                    from novedades_vigentes n
                        inner join cod_novedades cn using(cod_nov)
                        inner join personas p using(idper)
                        inner join parametros on unico_registro
                        left join (
                            select annio, idper, cod_nov, 
                                    sum(cantidad) as total,
                                    json_object_agg(origen, json_build_object('cantidad', cantidad) order by origen)::text as esquema
                                from per_nov_cant 
                                group by annio, idper, cod_nov
                        ) pn using (annio, idper, cod_nov)
                    group by annio, cod_nov, idper, 
                        pn.total, p.sector, pn.esquema            )`
        },
        hiddenColumns: ['esquema', 'detalle'],
    };
}
