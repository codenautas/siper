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
            cod_nov,
        ],
        primaryKey: [idper.name, año.name, pauta.name], // INCOMPLETO
        softForeignKeys: [
            {references: 'annios'  , fields: [año.name], onUpdate: 'no action'},
            {references: 'personas', fields: [idper.name], displayFields:['apellido', 'nombres', 'idmeta4', 'cuil', 'ficha']},
            {references: 'cod_novedades', fields: [cod_nov.name]},
            {references: 'pautas', fields:[pauta.name], displayFields:['descripcion']}
        ],
        constraints: [
        ],
        sql:{
            isTable: false,
            from:`(SELECT q.idper, null::integer as annio, q.pauta, null::text as cod_nov
                     FROM
                     (
                     SELECT idper, 'ACTULTDIA' pauta 
                       FROM personas
                       WHERE activo AND fecha_egreso IS NOT NULL
                     UNION
                     SELECT idper, 'ACTREGDES' pauta 
                       FROM personas
                       WHERE activo AND registra_novedades_desde IS NULL
                     UNION
                     SELECT idper, 'ACTSINANT' pauta 
                       FROM personas
                       WHERE activo AND para_antiguedad_relativa IS NULL
                     UNION
                     SELECT idper, 'INASINULT' pauta 
                       FROM personas
                       WHERE NOT activo AND fecha_egreso IS NULL
                     UNION
                     SELECT idper, 'ANULREGDES' pauta 
                       FROM personas
                       WHERE activo IS NULL AND registra_novedades_desde IS NOT NULL
                     UNION
                     SELECT idper, 'ANULCONULT' pauta 
                       FROM personas
                       WHERE activo IS NULL AND fecha_egreso IS NOT NULL
                     ) q
            )`
        }
    };
}
