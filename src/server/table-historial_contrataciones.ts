"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"

export function historial_contrataciones(context: TableContext): TableDefinition{
    var admin = context.user.rol==='admin' || context.user.rol==='rrhh';
    return {
        name: 'historial_contrataciones',
        elementName: 'historial_contratacion',
        title: 'historial de contrataciones',
        editable: admin,
        fields: [
            {...idper, editable:admin},
            {name:'desde'             , typeName:'date',                    },
            {name:'hasta'             , typeName:'date',                    },
            {name:'lapso_fechas'      , typeName:'daterange', editable:false, generatedAs:'daterange(desde, hasta)'},
            {name:'computa_antiguedad', typeName:'boolean',                 },
            {name:'organismo'         , typeName:'text',                    },
            {name:'observaciones'     , typeName:'text',                    },
        ],
        primaryKey: [idper.name, 'desde'],
        foreignKeys: [
            {references: 'personas', fields:[idper.name], onDelete:'cascade'},
        ],
        constraints: [
            {constraintType:'exclude', consName:'sin superponer fechas contratación', using:'GIST', fields:[idper.name, 'desde','computa_antiguedad', {fieldName:'lapso_fechas', operator:'&&'}]},
            {constraintType:'check' , expr:'computa_antiguedad is not false', consName:'computa_antiguedad si o vacio'},
        ]
    };
}
