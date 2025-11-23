"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

export const annio: FieldDefinition = {name: 'annio', typeName: 'integer', title: 'año'};

export function annios(context:TableContext):TableDefinition{
    var admin = context.es.admin;
    return {
        name:'annios',
        elementName: 'año',
        title:'años',
        editable:admin,
        fields:[
            annio,
            {name: 'abierto'                     , typeName: 'boolean', nullable: false, defaultValue: false, editable: false},
            {name: 'horario_habitual_desde'      , typeName: 'time'                                                    },
            {name: 'horario_habitual_hasta'      , typeName: 'time'                                                    },
            {name: 'anterior'                    , typeName: 'integer', editable: false},
       ],
        primaryKey: [annio.name],
        foreignKeys: [
            { references: 'annios', fields:[{source:'anterior', target:'annio'}], abr:'ant'}
        ],
        constraints:[
        ],
        detailTables:[
            {table: 'fechas'            , fields:[annio.name], abr:'f'},
            {table: 'nov_gru'           , fields:[annio.name], abr:'n', label:'novedades'},
        ]
    };
}
