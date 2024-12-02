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
            {name: 'usados'      , typeName: 'integer'}, 
            {name: 'pendientes'  , typeName: 'integer'},
            {name: 'disponibles' , typeName: 'integer'},
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
                        p.sector
                    from novedades_vigentes n
                        inner join cod_novedades cn using(cod_nov)
                        inner join personas p using(idper)
                        inner join parametros on unico_registro
                        left join (select annio, idper, cod_nov, sum(cantidad) as total from per_nov_cant group by annio, idper, cod_nov) pn using (annio, idper, cod_nov)
                    where n.con_novedad
                    group by annio, cod_nov, idper, 
                        pn.total, p.sector
            )`
        },
        hiddenColumns: [idper.name, cod_nov.name, sector.name],
    };
}
