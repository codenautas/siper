"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

export const nivel_educativo: FieldDefinition = {
    name: 'nivel_educativo', 
    typeName: 'text',
    title: 'nivel educativo'
};

export const max_nivel_ed: FieldDefinition = {
    name: 'max_nivel_ed', 
    typeName: 'text',
    title: 'máx nivel educativo'
};

export function niveles_educativos(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name:'niveles_educativos',
        elementName: 'nivel educativo',
        title:'niveles educativos',
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
