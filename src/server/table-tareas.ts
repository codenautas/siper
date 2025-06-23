"use strict";

import {FieldDefinition, TableDefinition, TableContext, sinMinusculas} from "./types-principal";

export const tarea: FieldDefinition = {
    name: 'tarea', 
    typeName: 'text', 
    postInput: sinMinusculas
};

export function tareas(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'tareas',
        elementName: 'tarea',
        title:'tareas',
        editable:admin,
        fields:[
            tarea,
            {name: 'descripcion'         , typeName: 'text', isName: true  },
            {name: 'horas_semanales'     , typeName: 'integer'},
            {name: 'horas_dia'           , typeName: 'integer'},
            {name: 'minimo_horas_por_dia', typeName: 'integer'},
            {name: 'maximo_horas_por_dia', typeName: 'integer'},
            {name: 'nocturno'            , typeName: 'boolean'},
            {name: 'fin_semana'          , typeName: 'boolean'},
            {name: 'guardia'             , typeName: 'boolean'},
            {name: 'hora_entrada_desde'  , typeName: 'time'   },
            {name: 'hora_salida_hasta'   , typeName: 'time'   },
            {name: 'horario_flexible'    , typeName: 'boolean'},
            {name: 'cod_2024'            , typeName: 'integer'},
        ],
        primaryKey:[tarea.name],
        constraints:[
        ],
        detailTables:[
            {table:'historial_contrataciones'       , fields:[tarea.name], abr:'H'},
        ]
    };
}
