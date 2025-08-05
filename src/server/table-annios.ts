"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

export const año: FieldDefinition = {name: 'annio', typeName: 'integer', title: 'año'};

export function annios(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name:'annios',
        elementName: 'año',
        title:'años',
        editable:admin,
        fields:[
            año,
            {name: 'abierto'                     , typeName: 'boolean', nullable: false, defaultValue: false, editable: false},
            {name: 'horario_habitual_desde'      , typeName: 'time'                                                    },
            {name: 'horario_habitual_hasta'      , typeName: 'time'                                                    },
       ],
        primaryKey: [año.name],
        constraints:[
        ],
        detailTables:[
            {table: 'fechas'            , fields:[año.name], abr:'f'},
            {table: 'nov_gru'           , fields:[año.name], abr:'n', label:'novedades'},
        ]
    };
}
