"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {fecha} from "./table-fechas"

export function avisos_falta_fichada(_context: TableContext): TableDefinition{
    return {
        name: 'avisos_falta_fichada',
        elementName: 'aviso_falta_fichada',
        editable: false,
        fields:[
            idper,
            fecha,
            {name: 'tipo_fichada',     typeName: 'text' },
            {name: 'avisado_wp',       typeName: 'timestamp' },
            {name: 'avisado_mail',     typeName: 'timestamp' },
            {name: 'llegada_novedad',  typeName: 'timestamp' },
        ],         
        primaryKey: [idper.name, fecha.name, 'tipo_fichada'],
        foreignKeys: [
            {references: 'personas', fields:[idper.name]}
        ],
    };
}
