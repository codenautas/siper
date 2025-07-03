"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {año} from "./table-annios"
import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades"
import {fecha} from "./table-fechas"

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
            {references: 'fechas'       , fields: [{source:'comienzo', target:fecha.name}], alias:'comienzo'},
            {references: 'fechas'       , fields: [{source:'vencimiento', target:fecha.name}], alias:'vencimiento'},
        ],
        detailTables: [
            {table:'novedades_vigentes', fields:[año.name, cod_nov.name, idper.name], abr:'N'}
        ],
    };
}
