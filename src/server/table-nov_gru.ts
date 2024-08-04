"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {año} from "./table-fechas";
import {clase} from "./table-clases";
import {grupo} from "./table-grupos";
import {cod_nov} from "./table-cod_novedades";

export function nov_gru(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'nov_gru',
        title: 'límite de novedades por persona',
        editable: admin,
        fields: [
            año, 
            cod_nov,
            clase,
            grupo,
            {name: 'maximo', typeName: 'integer', title: 'máximo'},
        ],
        primaryKey: [año.name, cod_nov.name, clase.name, grupo.name],
        foreignKeys: [
            {references: 'cod_novedades' , fields: [cod_nov.name          ]},
            {references: 'grupos'        , fields: [clase.name, grupo.name]},
        ],
        detailTables:[
            // {table:'novedades', fields:['annio','cod_nov',cuil.name], abr:'N'}
        ]
    };
}
