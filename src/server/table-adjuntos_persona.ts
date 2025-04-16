"use strict"

import { idper } from "./table-personas";
import { TableDefinition, TableContext , FieldDefinition} from "./types-principal";

export const numero_adjunto: FieldDefinition = {
    name: 'numero_adjunto',
    typeName: 'bigint', 
    title:'n°',
    nullable:true,
    editable:false,
}

export function adjuntos_persona(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin' || context.user.rol==='rrhh';
    return {
        name: 'adjuntos_persona',
        elementName: 'adjunto_persona',
        title: 'adjuntos',
        editable: admin,
        fields: [
            idper,
            {...numero_adjunto, sequence:{ firstValue:101, name:'numero_adjunto_seq' }},
            {name:'tipo_adjunto_persona', title: 'tipo adjunto', typeName:'text'},
            {name:'timestamp', typeName:'timestamp', defaultDbValue:'current_timestamp', editable:false, inTable:true, clientSide:'timestamp', title:'📅'},
            {name:'subir', editable:false, clientSide:'subirAdjunto', typeName:'text'},
            {name:'archivo_nombre', title:'archivo', editable:false , typeName:'text'},
            {name:'archivo_nombre_fisico', editable:false , typeName:'text'},
            {name:'bajar', editable:false, clientSide:'bajarAdjunto', typeName:'text'},
        ],
        primaryKey: [idper.name, 'numero_adjunto'],
        foreignKeys: [
            {references:'tipos_adjunto_persona', fields:['tipo_adjunto_persona'], displayFields:['descripcion']},
        ],
        constraints:[
        ],
        hiddenColumns: ['archivo_nombre_fisico'],
        detailTables: [
           {table:'adjuntos_persona_atributos', fields:[idper.name, numero_adjunto.name, 'tipo_adjunto_persona'], abr:'at', refreshFromParent:true, refreshParent:true },
        ]
    }
}