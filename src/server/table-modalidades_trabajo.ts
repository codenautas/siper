"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

export const modalidad_trabajo: FieldDefinition = {
    name: 'modalidad_trabajo', 
    typeName: 'text',
    title: 'modalidad_trabajo'
};

export function modalidades_trabajo(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name:'modalidades_trabajo',
        elementName: 'modalidad_trabajo',
        title:'modalidades_trabajo',
        editable:admin,
        fields:[
            modalidad_trabajo,
            {name: 'descripcion'      , typeName: 'text', isName: true  },
        ],
        primaryKey:[modalidad_trabajo.name],
        //constraints:[
        //],
        //detailTables:[
        //    {table:'personas'       , fields:[{source:modalidad_trabajo.name, target:modalidad_trabajo.name}], abr:'M'},
        //]
    };
}
