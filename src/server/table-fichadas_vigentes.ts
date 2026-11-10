"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades";
import {añoEnBaseAFecha} from "./table-fechas";

// visor de fichadas
// invariante sobre qué filas tienen que existir: ver el comentario ATENCIÓN de install/fichadas_vigentes_trgs.sql
export function fichadas_vigentes(context: TableContext): TableDefinition{
    return {
        name: 'fichadas_vigentes',
        editable: context.forDump,
        elementName: 'fichadas_vigentes',
        title:'Visor de fichadas',
        fields:[
            idper,
            {name: 'fecha' , typeName: 'date'},
            añoEnBaseAFecha,
            cod_nov,
            {name: 'fichadas'        , typeName: 'time_multirange', nullable:false, defaultDbValue:"'{}'"},
            {name: 'horario_entrada' , typeName: 'time'},
            {name: 'horario_salida'  , typeName: 'time'},
        ],
        primaryKey: [idper.name, 'fecha'],
        foreignKeys: [
            {references: 'personas', fields: [idper.name], displayFields:['ficha', 'apellido', 'nombres']},
            {references: 'cod_novedades', fields: [cod_nov.name], displayFields:['novedad']},
        ],
        constraints: [
        ],
        detailTables: [
            {table:'fichadas'             , fields:[idper.name, 'fecha'], abr:'F'},
        ],
        sql:{
            skipEnance: true,
        }
    };
}
