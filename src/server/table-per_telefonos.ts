"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {tipo_telefono} from "./table-tipos_telefono";

export const nro_item: FieldDefinition = {name: 'nro_item', typeName: 'bigint', description: 'identificador del teléfono para una persona'}

export function per_telefonos(context: TableContext): TableDefinition{
    var admin = context.es.rrhh;
    return {
        name: 'per_telefonos',
        title: 'Telefonos',
        editable: admin,
        fields: [
            {...idper, editable:admin},
            {name:'nro_item'       , typeName:'bigint', nullable:true, editable:false},
            tipo_telefono,
            {name: 'telefono'      ,typeName:'text'},
            {name: 'observaciones' ,typeName:'text'},
            {name: 'orden'         ,typeName:'integer', inTable:false, serverSide:true, editable:false},
        ],
        primaryKey: [idper.name, 'nro_item'],
        foreignKeys: [
            {references: 'personas'   , fields: [idper.name]},
            {references: 'tipos_telefono', fields: [tipo_telefono.name]},
        ],
        constraints: [
        ],
        sql:{
            fields: {
                orden:{ expr:`(SELECT orden 
                                 FROM tipos_telefono t 
                                 WHERE per_telefonos.tipo_telefono = t.tipo_telefono
                )`}
           },
        }
    }
}
