"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {capacitacion} from "./table-capacitaciones";
import {modalidad} from "./table-capa_modalidades";
import {tipo} from "./table-capacitaciones";
import {fecha_inicio} from "./table-capacitaciones";


export function per_capa(context: TableContext): TableDefinition{
    var admin = context.es.admin || context.es.rrhh;
    return {
        name: 'per_capa',
        title: 'Capacitaciones por persona',
        editable: admin,
        fields: [
            {...idper, editable:admin},
            capacitacion,
            modalidad,
            tipo,
            fecha_inicio,
            {name: 'inscripcion',typeName:'text' },
            {name: 'calificacion',typeName:'text' },
        ],
        primaryKey: [idper.name, capacitacion.name, modalidad.name, 'tipo', 'fecha_inicio'],
        foreignKeys: [
            {references: 'personas'  , fields: [idper.name]},
            {references: 'capacitaciones', fields: [capacitacion.name, modalidad.name, tipo.name, fecha_inicio.name]}
        ],
        constraints: [
        ]
    }
}
