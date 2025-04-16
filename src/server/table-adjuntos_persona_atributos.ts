"use strict"

import { idper } from "./table-personas";
import { numero_adjunto } from "./table-adjuntos_persona";

import { TableDefinition, TableContext } from "./types-principal";

export function adjuntos_persona_atributos(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin' || context.user.rol==='rrhh';
    return {
        name: 'adjuntos_persona_atributos',
        elementName: 'adjunto_persona_atributo',
        title: 'adjuntos persona atributos',
        editable: admin,
        fields: [
            idper,
            numero_adjunto,
            {name:'tipo_adjunto_persona', title: 'tipo adjunto', typeName:'text', nullable:false},
            {name:'atributo', title: 'atributo', typeName:'text'},
            {name:'valor', typeName:'text', title:'valor'},
        ],
        primaryKey: [idper.name, 'numero_adjunto', 'atributo'],
        foreignKeys: [
            {references:'tipos_adjunto_persona_atributos',  fields: ['tipo_adjunto_persona', 'atributo']},
            {references:'adjuntos_persona', fields: [idper.name, numero_adjunto.name]},
        ],
        hiddenColumns: ['tipo_adjunto_persona'],
    }
}