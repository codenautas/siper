"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades";
import {sector} from "./table-sectores";
import { sqlParteDiario } from "./table-parte-diario";

// visor de fichadas
export function fichadas_vigentes(_context: TableContext): TableDefinition{
    return {
        name: 'fichadas_vigentes',
        elementName: 'fichadas_vigentes',
        title:'Visor de fichadas',
        fields:[
            idper,
            {name: 'fecha' , typeName: 'date'},
            sector,
            cod_nov,
            {name: 'fichada_entrada' , typeName: 'time'},
            {name: 'fichada_salida'  , typeName: 'time'},
            {name: 'horario_entrada' , typeName: 'time'},
            {name: 'horario_salida'  , typeName: 'time'},
        ],
        primaryKey: [idper.name, 'fecha', cod_nov.name],
        softForeignKeys: [
            {references: 'personas', fields: [idper.name], displayFields:['ficha', 'apellido', 'nombres']},
            {references: 'cod_novedades', fields: [cod_nov.name], displayFields:['novedad']},
            {references: 'sectores', fields: [sector.name], displayFields:['nombre_sector']},
        ],
        constraints: [
        ],
        detailTables: [
            {table:'fichadas'             , fields:[idper.name, 'fecha'], abr:'F'},
        ],
        sql:{
            isTable: false,
            skipEnance: true,
            from:`(${sqlParteDiario})`
        }
    };
}
