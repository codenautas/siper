"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {año} from "./table-fechas"
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
        ],
        primaryKey: [año.name, cod_nov.name, cuil.name],
        softForeignKeys: [
            {references: 'personal'     , fields: [cuil.name]},
            {references: 'cod_novedades', fields: [cod_nov.name]},
        ],
        detailTables: [
            {table:'novedades', fields:[año.name, cod_nov.name, cuil.name], abr:'N'}
        ],
        sql: {
            isTable:false,
            from:`(
                select extract(year from fecha) as annio, cod_nov, cuil, count(*) as cantidad
                    from novedades
                    group by extract(year from fecha), cod_nov, cuil
            )`
        }
    };
}
