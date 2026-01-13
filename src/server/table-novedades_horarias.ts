"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades";
import {fecha} from "./table-fechas"
import {annio} from "./table-annios"
import {politicaNovedades} from "./table-novedades_registradas"

export const idr: FieldDefinition = {name: 'idr', typeName: 'bigint', description: 'identificador de la novedad registrada'}

export function novedades_horarias(_context: TableContext): TableDefinition{
    return {
        name: 'novedades_horarias',
        elementName: 'novedad horaria',
        editable: true,
        fields:[
            idper,
            fecha,
            {name: 'lapso'     , typeName: 'tsrange'   , editable:false, nullable: true     },
            {name: 'desde_hora', typeName: 'time'      ,                                    },
            {name: 'hasta_hora', typeName: 'time'      ,                                    },
            cod_nov,
            {...annio, editable:false, generatedAs:`extract(year from fecha)`},
            {name: 'detalles' , typeName: 'text'   ,                                    },
        ],         
        primaryKey: [idper.name, fecha.name, 'lapso'],
        foreignKeys: [
            {references: 'annios'  , fields: [annio.name], onUpdate: 'no action'},
            {references: 'personas', fields: [idper.name]},
            {references: 'cod_novedades', fields: [cod_nov.name]},
            {references: 'fechas', fields: [fecha.name], alias:'desde'},
        ],
        constraints: [
            {constraintType:'check', consName:'desde anterior a hasta', expr:`desde_hora < hasta_hora`},
            {constraintType:'check', consName:'desde, hasta no ambos nulos', expr:`desde_hora is not null or hasta_hora is not null`},
            {constraintType:'exclude', consName:'sin superponer', using:'GIST', fields:[idper.name, {fieldName:'lapso', operator:'&&'}]}
        ],
        hiddenColumns: [idr.name],
        sql:{
            policies: politicaNovedades('novedades_horarias', 'fecha'),
        }
    };
}
