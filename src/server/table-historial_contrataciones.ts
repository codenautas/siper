"use strict";

import {TableDefinition, TableContext, soloMayusculas} from "./types-principal";

import {idper} from "./table-personas"
import { s_revista } from "table-situacion_revista";

export function historial_contrataciones(context: TableContext): TableDefinition{
    var admin = context.user.rol==='admin' || context.user.rol==='rrhh';
    return {
        name: 'historial_contrataciones',
        elementName: 'historial de contratación',
        title: 'historial de contrataciones',
        editable: admin,
        fields: [
            {...idper, editable:admin},
            {name:'desde'             , typeName:'date',                    },
            {name:'hasta'             , typeName:'date',                    },
            {name:'lapso_fechas'      , typeName:'daterange', visible:false, generatedAs:'daterange(desde, hasta)'},
            {name:'computa_antiguedad', typeName:'boolean',                 },
            {name:'organismo'         , typeName:'text',                    },
            {name:'observaciones'     , typeName:'text',                    },
            s_revista
        ],
        primaryKey: [idper.name, 'desde'],
        foreignKeys: [
            {references: 'personas', fields:[idper.name], onDelete:'cascade'},
            {references: 'situacion_revista', fields:[s_revista.name]},
        ],
        constraints: [
            {constraintType:'exclude', consName:'sin superponer fechas contratación', using:'GIST', fields:[idper.name, {fieldName:'lapso_fechas', operator:'&&'}], where:'computa_antiguedad'},
            {constraintType:'check' , expr:'computa_antiguedad is not false', consName:'computa_antiguedad si o vacio'},
            soloMayusculas(s_revista.name),
        ]
    };
}
