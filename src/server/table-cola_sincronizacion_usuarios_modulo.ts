"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"

export function cola_sincronizacion_usuarios_modulo(context: TableContext): TableDefinition{
    return {
        name: 'cola_sincronizacion_usuarios_modulo',
        elementName: 'sincronizacion_usuarios_modulo',
        editable: context.forDump,
        fields:[
            {name: 'num_sincro'       , typeName: 'bigint' , nullable: false, sequence:{firstValue:1, name:'cola_usuarios_seq'}},
            {name: idper.name         , typeName: 'text'   , nullable: false},
            {name: 'accion'           , typeName: 'text'   , nullable: false},
            {name: 'estado'           , typeName: 'text'   , nullable: false},
            {name: 'intentos'         , typeName: 'integer', nullable: false, defaultValue:0},
            //{name:  'ejecutar SP'     , editable:false, clientSide:'ejecutarSP', typeName:'text'},
            {name: 'respuesta_sp'     , typeName: 'text'   },
            {name: 'creado_en'        , typeName: 'timestamp'  },
            {name: 'actualizado_en'   , typeName: 'timestamp'  },

        ],         
        primaryKey: ['num_sincro'],
        constraints: [
            {constraintType: 'check', consName: 'estados_cola', expr: `estado IN ('PENDIENTE', 'EN_PROCESO', 'PROCESADO', 'ERROR', 'AGOTADO')`}, // Ensure 'rol' is in lowercase
        ],
    };
}
