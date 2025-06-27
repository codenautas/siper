"use strict";

import {TableDefinition, TableContext, soloMayusculas} from "./types-principal";

import { politicaNovedades } from "./table-novedades_registradas";

import {idper} from "./table-personas"
import { s_revista } from "./table-situacion_revista";
import { expediente } from "./table-expedientes";
import { funcion } from "./table-funciones";
import { jerarquia } from "./table-jerarquias";
import { n_grado } from "./table-nivel_grado";
import { tarea } from "./table-tareas";
import { motivo_egreso } from "./table-motivos_egreso";
import { agrupamiento } from "./table-agrupamientos";
import { tramo } from "./table-tramos";
import { grado } from "./table-grados";
import { categoria } from "./table-categorias";

export function historial_contrataciones(context: TableContext): TableDefinition{
    var admin = context.es.admin || context.es.rrhh;
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
            s_revista,
            expediente,
            funcion,
            jerarquia,
            n_grado,
            tarea,
            motivo_egreso,
            agrupamiento,
            tramo,
            grado,
            categoria,
            {name:'fecha_nombramiento', typeName:'date',                    },
            {name:'resolucion'        , typeName:'text',                    },
        ],
        primaryKey: [idper.name, 'desde'],
        foreignKeys: [
            {references: 'personas', fields:[idper.name], onDelete:'cascade'},
            {references: 'situacion_revista', fields:[s_revista.name]},
            {references: 'expedientes', fields:[expediente.name]},
            {references: 'funciones', fields:[funcion.name]},
            {references: 'jerarquias', fields:[jerarquia.name]},
            {references: 'nivel_grado', fields:[n_grado.name]},
            {references: 'tareas', fields:[tarea.name]},
            {references: 'motivos_egreso', fields:[motivo_egreso.name]},
            {references: 'agrupamientos', fields:[agrupamiento.name]},
            {references: 'tramos', fields:[tramo.name]},
            {references: 'grados', fields:[tramo.name, grado.name]},
            {references: 'categorias', fields:[categoria.name]},
        ],
        constraints: [
            {constraintType:'exclude', consName:'sin superponer fechas contratación', using:'GIST', fields:[idper.name, {fieldName:'lapso_fechas', operator:'&&'}], where:'computa_antiguedad'},
            {constraintType:'check' , expr:'computa_antiguedad is not false', consName:'computa_antiguedad si o vacio'},
            soloMayusculas(s_revista.name),
            soloMayusculas(expediente.name),
            soloMayusculas(jerarquia.name),
            soloMayusculas(n_grado.name),
            soloMayusculas(motivo_egreso.name),
        ],
        sql: {
            policies: politicaNovedades('historial_contrataciones', 'desde'),
        },

    };
}
