"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades";
import {año} from "./table-annios"
import {pauta} from "./table-pautas"

export function inconsistencias(_context: TableContext): TableDefinition{
    return {
        name: 'inconsistencias',
        elementName: 'inconsistencia',
        fields:[
            idper,
            año,
            pauta,
            cod_nov
        ],         
        primaryKey: [idper.name, año.name, pauta.name], // INCOMPLETO
        softForeignKeys: [
            {references: 'annios'  , fields: [año.name], onUpdate: 'no action'},
            {references: 'personas', fields: [idper.name], displayFields:['apellido', 'nombres', 'idmeta4', 'cuil', 'ficha']},
            {references: 'cod_novedades', fields: [cod_nov.name]},
        ],
        constraints: [
        ],
        sql:{
            isTable: false,
            from:`(select null::text as idper, null::integer as annio, null::text as pauta, null::text as cod_nov)`
        }
    };
}
