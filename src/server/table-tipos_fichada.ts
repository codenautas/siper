"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinMinusculas} from "./types-principal";

export const tipo_fichada:FieldDefinition = {
    name: 'tipo_fichada', 
    typeName: 'text',
    postInput: sinMinusculas
}

export function tipos_fichada(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name: 'tipos_fichada',
        elementName: 'tipo_fichada',
        editable: admin,
        fields: [
            tipo_fichada,
            {name: 'nombre',typeName:'text' , isName:true, nullable: false, postInput: sinMinusculas},
            {name: 'orden' ,typeName:'integer', nullable: false},
        ],
        primaryKey: [tipo_fichada.name],
        //sortColumns:[{column:'orden'}]
        sql:{
            orderBy: ['orden']
        }
    }
};
