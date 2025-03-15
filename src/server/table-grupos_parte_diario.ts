"use strict";

import {FieldDefinition, TableDefinition, TableContext, soloCodigo} from "./types-principal";

export const grupo_parte_diario:FieldDefinition = {
    name: 'grupo_parte_diario', 
    typeName: 'text', 
    postInput: 'upperWithoutDiacritics'
}

export function grupos_parte_diario(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'grupos_parte_diario',
        elementName: 'grupo_parte_diario',
        editable: admin,
        fields: [
            grupo_parte_diario,
            {name: 'descripcion', typeName: 'text'   , isName:true},
            {name: 'grupo_padre', typeName: 'text'                },
            {name: 'orden'      , typeName: 'integer'             },
            {name: 'nivel'      , typeName: 'integer'             },
            {name: 'es_cod_nov' , typeName: 'boolean'             },

        ],
        primaryKey: [grupo_parte_diario.name],
        constraints: [
            {constraintType: 'unique', fields: ['descripcion']},
            soloCodigo(grupo_parte_diario.name),
        ],
    };
}
