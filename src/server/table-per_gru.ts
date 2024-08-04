"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {cuil} from "./table-personal";
import {clase} from "./table-clases";
import {grupo} from "./table-grupos";

export function per_gru(context: TableContext): TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'per_gru',
        elementName: 'persona-grupo',
        editable:admin,
        fields: [
            cuil,
            clase,
            grupo,
        ],
        primaryKey: [cuil.name, clase.name],
        foreignKeys: [
            {references:'personal'       , fields:[cuil.name]             , displayAllFields:true},
            {references:'grupos'         , fields:[clase.name, grupo.name], displayAllFields:true},
        ]
    };
}
