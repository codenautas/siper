"use strict";

import {FieldDefinition, TableDefinition, TableContext, soloCodigo} from "./types-principal";

export const clase:FieldDefinition = {
    name: 'clase', 
    typeName: 'text', 
    postInput: 'upperWithoutDiacritics',
    description:'la clase que determina los grupos que deben considerarse para los límites anuales de cada persona en cada grupo'
}

export function clases(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name:'clases',
        elementName: 'clase',
        editable:admin,
        fields:[
            clase,
            {name: 'nombre'      , typeName: 'text'   , isName:true   , },
        ],
        primaryKey: [clase.name],
        constraints:[
            {constraintType:'unique', fields:['nombre']},
            soloCodigo(clase.name),
        ],
        detailTables:[
            {table:'grupos'            , fields:[clase.name], abr:'g'},
        ]
    };
}
