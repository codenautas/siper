"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {año} from "./table-annios"
import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades"

export function per_nov_cant(context: TableContext): TableDefinition {
    var admin = context.user.rol==='admin';
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
        softForeignKeys: [
            {references: 'annios'       , fields: [año.name], onUpdate: 'no action'},
            {references: 'personas'     , fields: [idper.name]},
            {references: 'cod_novedades', fields: [cod_nov.name]},
        ],
        detailTables: [
            {table:'novedades_vigentes', fields:[año.name, cod_nov.name, idper.name], abr:'N'}
        ],
    };
}
