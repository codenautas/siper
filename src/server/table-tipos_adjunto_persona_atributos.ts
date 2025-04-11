"use strict";

import { TableDefinition, TableContext } from "./types-principal";

export function tipos_adjunto_persona_atributos(context: TableContext): TableDefinition {
    const admin = context.user.rol === 'admin';
    return {
        name: 'tipos_adjunto_persona_atributos',
        elementName: 'tipo_adjunto_persona_atributo',
        editable: admin,
        fields: [
            { name: 'tipo_adjunto_persona', typeName: 'text', nullable: false },
            { name: 'atributo', typeName: 'text', nullable: false },
            { name: 'orden', typeName: 'integer', nullable: false },
            { name: 'columna', typeName: 'integer', nullable: false },
        ],
        primaryKey: ['tipo_adjunto_persona', 'atributo'],
        foreignKeys: [
            {
                references: 'tipos_adjunto_persona',
                fields: ['tipo_adjunto_persona'], 
            },
        ],
        constraints: [],
        detailTables: [],
    };
}