"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {año} from "./table-annios"
import {cuil} from "./table-personal"
import {cod_nov} from "./table-cod_novedades"

export function nov_per(_context: TableContext): TableDefinition {
    return {
        name:'nov_per',
        title: 'cantidad de novedades por persona',
        editable: false,
        fields:[
            año,
            cod_nov,
            cuil,
            {name: 'cantidad', typeName: 'integer'},
            {name: 'limite'  , typeName: 'integer', title:'límite'},
            {name: 'saldo'   , typeName: 'integer'},
        ],
        primaryKey: [año.name, cod_nov.name, cuil.name],
        softForeignKeys: [
            {references: 'annios'       , fields: [año.name], onUpdate: 'no action'},
            {references: 'personal'     , fields: [cuil.name]},
            {references: 'cod_novedades', fields: [cod_nov.name]},
        ],
        detailTables: [
            {table:'novedades_vigentes', fields:[año.name, cod_nov.name, cuil.name], abr:'N'}
        ],
        sql: {
            isTable:false,
            from:`(
                select annio, cod_nov, cuil, count(*) as cantidad, maximo as limite, maximo - count(*) as saldo
                    from novedades_vigentes n
                        inner join cod_novedades cn using(cod_nov)
                        inner join personal p using(cuil)
                        left join per_gru pg using(clase, cuil)
                        left join nov_gru ng using(annio, cod_nov, clase, grupo)
                    group by annio, cod_nov, cuil, maximo
            )`
        }
    };
}
