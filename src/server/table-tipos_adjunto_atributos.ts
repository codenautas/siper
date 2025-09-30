"use strict";

import { TableDefinition, TableContext } from "./types-principal";

export function tipos_adjunto_atributos(context: TableContext): TableDefinition {
    var admin = context.es.admin;
    return {
        name: 'tipos_adjunto_atributos',
        elementName: 'tipo_adjunto_atributo',
        editable: admin,
        fields: [
            { name: 'tipo_adjunto', typeName: 'text', nullable: false },
            { name: 'atributo', typeName: 'text', nullable: false},
            { name: 'orden', typeName: 'integer', nullable: false},
            { name: 'columna', typeName: 'integer', nullable: false},
        ],
        primaryKey: ['tipo_adjunto', 'atributo'],
        foreignKeys: [
            { references: 'tipos_adjunto', fields: ['tipo_adjunto']},
        ],
    };
}