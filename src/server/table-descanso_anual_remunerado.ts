"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {año} from "./table-annios"
import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades"
import {sector} from "./table-sectores"

// hecho en base a table-nov_per con mas campos, consulto despues para usar esa vista y pasar el codigo
// de novedad como parametro. por ahora replico el contenido y paso el cod_nov = 1 directamente
export function descanso_anual_remunerado(_context: TableContext): TableDefinition {
    return {
        name:'descanso_anual_remunerado',
        title: 'descanso anual remunerado pendiente',
        editable: false,
        fields:[
            idper,
            sector,
            año,
            cod_nov,
            {name: 'cantidad', typeName: 'integer'},
            {name: 'limite'  , typeName: 'integer', title:'límite'},
            {name: 'saldo'   , typeName: 'integer'},
        ],
        primaryKey: [año.name, cod_nov.name, idper.name],
        softForeignKeys: [
            {references: 'annios'       , fields: [año.name]},
            {references: 'personas'     , fields: [idper.name], displayFields:['ficha', 'cuil', 'apellido', 'nombres']},
            {references: 'sectores'     , fields: [sector.name]},
        ],
        hiddenColumns: [idper.name, cod_nov.name, sector.name],
        sql: {
            isTable:false,
            from:`(
                select annio, cod_nov, idper, max(origen) as origen, count(*) as cantidad, cantidad as limite, cantidad - count(*) as saldo, p.sector
                    from novedades_vigentes n
                        inner join cod_novedades cn using(cod_nov)
                        inner join personas p using(idper)
                        left join per_nov_cant using(annio, idper, cod_nov)
                    where n.con_novedad and cod_nov = '1'
                    group by annio, cod_nov, idper, cantidad, p.sector
            )`
        }
    };
}
