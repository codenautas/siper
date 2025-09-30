"use strict"

import { idper } from "./table-personas";
import { numero_adjunto } from "./table-adjuntos";

import { TableDefinition, TableContext } from "./types-principal";

export function adjuntos_atributos(context:TableContext):TableDefinition{
    var admin = context.es.rrhh;
    return {
        name: 'adjuntos_atributos',
        elementName: 'adjunto_atributo',
        title: 'adjuntos atributos',
        editable: admin,
        fields: [
            idper,
            numero_adjunto,
            {name:'tipo_adjunto', title: 'tipo adjunto', typeName:'text', nullable:false},
            {name:'atributo', title: 'atributo', typeName:'text'},
            {name:'valor', typeName:'text', title:'valor'},
        ],
        primaryKey: ['numero_adjunto', 'atributo'],
        foreignKeys: [
            {references:'tipos_adjunto_atributos',  fields: ['tipo_adjunto', 'atributo']},
            {references:'adjuntos', fields: [idper.name, numero_adjunto.name], onDelete:'cascade'},
        ],
        hiddenColumns: ['tipo_adjunto'],
    }
}