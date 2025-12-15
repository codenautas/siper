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

export function adjuntos(context:TableContext):TableDefinition{
    var admin = context.es.rrhh;
    return {
        name: 'adjuntos',
        elementName: 'adjunto',
        title: 'adjuntos',
        editable: admin,
        fields: [
            {...numero_adjunto, sequence:{ firstValue:101, name:'numero_adjunto_seq' }},
            {...idper, editable: false},
            {name:'tipo_adjunto', title: 'tipo adjunto', typeName:'text'},
            {name:'timestamp', typeName:'timestamp', defaultDbValue:'current_timestamp', editable:false, inTable:true, clientSide:'timestamp', title:'📅'},
            {name:'subir', editable:false, clientSide:'subirAdjunto', typeName:'text'},
            {name:'archivo_nombre', title:'archivo', editable:false , typeName:'text'},
            {name:'archivo_nombre_fisico', editable:false , typeName:'text'},
            {name:'bajar', editable:false, clientSide:'bajarAdjunto', typeName:'text'},
        ],
        primaryKey: ['numero_adjunto'],
        foreignKeys: [
            {references:'tipos_adjunto', fields:['tipo_adjunto'], displayFields:['descripcion']},
            {references:'personas', fields: [idper.name]},
        ],
        constraints:[
        ],
        hiddenColumns: ['archivo_nombre_fisico'],
        detailTables: [
           {table:'adjuntos_atributos', fields:[idper.name, numero_adjunto.name, 'tipo_adjunto'], abr:'at', refreshFromParent:true, refreshParent:true },
        ],
        sql: {orderBy: ['tipo_adjunto', numero_adjunto.name],}
    }
}