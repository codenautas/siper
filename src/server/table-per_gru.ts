"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas";
import {clase} from "./table-clases";
import {grupo} from "./table-grupos";

export function per_gru(context: TableContext): TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'per_gru',
        elementName: 'persona-grupo',
        editable:admin,
        fields: [
            idper,
            clase,
            grupo,
        ],
        primaryKey: [idper.name, clase.name],
        foreignKeys: [
            {references:'personas'       , fields:[idper.name]             , displayAllFields:true, onDelete: 'cascade'},
            {references:'grupos'         , fields:[clase.name, grupo.name], displayAllFields:true},
        ]
    };
}
