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
            {name: 'origen' , typeName: 'text'},
            cod_nov,
            idper,
            {name: 'cantidad', typeName: 'integer'},
            {name: 'limite'  , typeName: 'integer', title:'límite'},
            {name: 'saldo'   , typeName: 'integer'},
        ],
        primaryKey: [año.name, cod_nov.name, 'origen', idper.name],
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
                select annio, cod_nov, idper, max(origen) as origen, count(*) as cantidad, cantidad as limite, cantidad - count(*) as saldo
                    from novedades_vigentes n
                        inner join cod_novedades cn using(cod_nov)
                        inner join personas p using(idper)
                        left join per_nov_cant using(annio, idper, cod_nov)
                    where n.con_novedad
                    group by annio, cod_nov, idper, cantidad
            )`
        }
    };
}
