"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {año} from "./table-annios"
import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades"

export function per_nov_cant(context: TableContext): TableDefinition {
    var admin = context.es.admin || context.es.rrhh;
    return {
        name:'per_nov_cant',
        title: 'cantidad de novedades por persona',
        editable: admin,
        fields:[
            año,
            cod_nov,
            idper,
            {name: 'origen'     , typeName: 'text'   },
            {name: 'cantidad'   , typeName: 'integer'},
            {name: 'comienzo'   , typeName: 'date'   },
            {name: 'vencimiento', typeName: 'date'   },
        ],
        primaryKey: [año.name, cod_nov.name, idper.name, 'origen'],
        foreignKeys: [
            {references: 'annios'       , fields: [año.name], onUpdate: 'no action'},
            {references: 'personas'     , fields: [idper.name]},
            {references: 'cod_novedades', fields: [cod_nov.name]},
        ],
        detailTables: [
            {table:'novedades_vigentes', fields:[año.name, cod_nov.name, idper.name], abr:'N'}
        ],
        constraints: [
            {constraintType:'check', consName:'annio de comienzo debe ser igual a annio', expr:`extract(year from comienzo) is not distinct from annio or comienzo is null`},
            {constraintType:'check', consName:'annio de vencimiento debe ser igual a annio', expr:`extract(year from vencimiento) is not distinct from annio or vencimiento is null`},
        ]
    };
}
