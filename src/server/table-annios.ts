"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

export const año: FieldDefinition = {name: 'annio', typeName: 'integer', title: 'año'};


export function annios(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'annios',
        elementName: 'año',
        title:'años',
        editable:admin,
        fields:[
            año,
            {name: 'cerrado', typeName: 'boolean'},
        ],
        primaryKey: [año.name],
        detailTables:[
            {table: 'fechas'            , fields:[año.name], abr:'f'},
            {table: 'nov_gru'           , fields:[año.name], abr:'n', label:'novedades'},
        ]
    };
}
