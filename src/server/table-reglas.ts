"use strict";

import {TableDefinition, TableContext} from "./types-principal";

export function reglas(_context: TableContext): TableDefinition{
    var admin = _context.es.admin;
    return {
        name: 'reglas',
        editable: admin,
        fields:[
            {name: 'unico_registro'                     , typeName: 'boolean'},
            {name: 'codnov_unica_fichada'               , typeName: 'text'},
            {name: 'codnov_sin_fichadas'                , typeName: 'text'},
            {name: 'umbral_horas_mensuales'             , typeName: 'integer'},
            {name: 'umbral_horas_diarias'               , typeName: 'integer'},
            {name: 'umbral_horas_semanales'             , typeName: 'integer'},
            {name: 'umbral_horas_personales'            , typeName: 'integer'},
            {name: 'horario_consolidacion'              , typeName: 'timestamp'},
            {name: 'minimas_horas_diarias_declaradas'   , typeName: 'integer'},
            {name: 'maximas_horas_diarias_declaradas'   , typeName: 'integer'},
        ],         
        primaryKey: ['unico_registro'],
        foreignKeys: [
            {references: 'cod_novedades', fields:[{source:'codnov_unica_fichada', target:'cod_nov'}], alias:'codnov_unica_fichada'},
            {references: 'cod_novedades'  , fields:[{source:'codnov_sin_fichadas', target:'cod_nov'}], alias:'codnov_sin_fichadas'},
        ]
    };
}
