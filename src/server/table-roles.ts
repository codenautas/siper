"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

export const rol:FieldDefinition = {
    name: 'rol', 
    typeName: 'text', 
    postInput: 'upperWithoutDiacritics'
}

export function roles(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'roles',
        elementName: 'rol',
        editable: admin,
        fields: [
            rol,
            {name: 'descripcion'              , typeName: 'text'   },
            {name: 'puede_ver_novedades'      , typeName: 'boolean'},
            {name: 'puede_cargar_todo'        , typeName: 'boolean'},
            {name: 'puede_ver_todo'           , typeName: 'boolean'},
            {name: 'puede_cargar_dependientes', typeName: 'boolean'},
            {name: 'puede_ver_dependientes'   , typeName: 'boolean'},
            {name: 'puede_cargar_propio'      , typeName: 'boolean'},
            {name: 'puede_ver_propio'         , typeName: 'boolean'},
            {name: 'puede_corregir_el_pasado' , typeName: 'boolean'},
        ],
        primaryKey: [rol.name],
        constraints: [
            {constraintType: 'unique', fields: ['descripcion']},
        ],
        detailTables: [
            {table: 'personas', fields: [rol.name], abr:'p'},
        ]
    };
}
