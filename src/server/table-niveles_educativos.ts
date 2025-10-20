"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

export const nivel_educativo: FieldDefinition = {
    name: 'nivel_educativo', 
    typeName: 'integer',
    title: 'Nivel Educativo'
};

export const max_nivel_ed: FieldDefinition = {
    name: 'max_nivel_ed', 
    typeName: 'integer',
    title: 'Max Nivel Educativo'
};

export function niveles_educativos(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name:'niveles_educativos',
        elementName: 'nivel_educativo',
        title:'Nivel Educativo',
        editable:admin,
        fields:[
            nivel_educativo,
            {name: 'nombre'      , typeName: 'text', isName: true  },
        ],
        primaryKey:[nivel_educativo.name],
        constraints:[
        ],
        detailTables:[
            {table:'personas'       , fields:[{source:nivel_educativo.name, target:max_nivel_ed.name}], abr:'P'},
        ]
    };
}
