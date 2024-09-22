"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {año} from "./table-annios"
import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades"

export function nov_per(_context: TableContext): TableDefinition {
    return {
        name:'nov_per',
        title: 'cantidad de novedades por persona',
        editable: false,
        fields:[
            año,
            cod_nov,
            idper,
            {name: 'cantidad', typeName: 'integer'},
            {name: 'limite'  , typeName: 'integer', title:'límite'},
            {name: 'saldo'   , typeName: 'integer'},
        ],
        primaryKey: [año.name, cod_nov.name, idper.name],
        softForeignKeys: [
            {references: 'annios'       , fields: [año.name], onUpdate: 'no action'},
            {references: 'personas'     , fields: [idper.name]},
            {references: 'cod_novedades', fields: [cod_nov.name]},
        ],
        detailTables: [
            {table:'novedades_vigentes', fields:[año.name, cod_nov.name, idper.name], abr:'N'}
        ],
        sql: {
            isTable:false,
            from:`(
                select annio, cod_nov, idper, count(*) as cantidad, maximo as limite, maximo - count(*) as saldo
                    from novedades_vigentes n
                        inner join cod_novedades cn using(cod_nov)
                        inner join personas p using(idper)
                        left join per_gru pg using(clase, idper)
                        left join nov_gru ng using(annio, cod_nov, clase, grupo)
                    group by annio, cod_nov, idper, maximo
            )`
        }
    };
}
