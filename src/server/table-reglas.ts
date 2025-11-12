"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {annio} from "./table-annios"

export function reglas(_context: TableContext): TableDefinition{
    return {
        name: 'reglas',
        elementName: 'regla',
        editable: false,
        fields:[
            annio,
            {name: 'codnov_unica_fichada',              typeName: 'text'    },
            {name: 'codnov_sin_fichadas',               typeName: 'text'    },
            {name: 'umbral_horas_mensuales',            typeName: 'integer' },
            {name: 'umbral_horas_diarias',              typeName: 'integer' },
            {name: 'umbral_horas_semanales',            typeName: 'integer' },
            {name: 'umbral_horas_personales',           typeName: 'integer' },
            {name: 'horario_consolidado',               typeName: 'time'    },
            {name: 'minimas_horas_diarias_declaradas',  typeName: 'integer' },
            {name: 'maximas_horas_diarias_declaradas',  typeName: 'integer' },
        ],         
        primaryKey: [annio.name],
        foreignKeys: [],
    };
}
