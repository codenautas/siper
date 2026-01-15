"use strict";

import {TableDefinition, TableContext} from "./types-principal";

export const ACCIONES = {
    DESACTIVAR: 'DESACTIVAR',
    ACTUALIZAR: 'ACTUALIZAR'
};

export const ESTADOS = {
    PENDIENTE:'PENDIENTE', 
    EN_PROCESO:'EN_PROCESO', 
    PROCESADO:'PROCESADO', 
    ERROR:'ERROR',
    AGOTADO: 'AGOTADO'
};


export function sinc_fichadores(context: TableContext): TableDefinition{
    return {
        name: 'sinc_fichadores',
        elementName: 'sinc_fichador',
        editable: context.forDump,
        fields:[
            {name: 'num_sincro'       , typeName: 'bigint' , nullable: false, sequence:{firstValue:1, name:'sinc_usuarios_seq'}},
            {name: 'usuario'          , typeName: 'text'   , nullable: false},
            {name: 'accion'           , typeName: 'text'   , nullable: false},
            {name: 'estado'           , typeName: 'text'   , nullable: false},
            {name: 'intentos'         , typeName: 'integer', nullable: false, defaultValue:0},
            {name: 'ejecutar_SP'      , editable:false, clientSide:'ejecutarSPModuloFichadas', typeName:'text'},
            {name: 'parametros'       , typeName: 'text'   },
            {name: 'respuesta_sp'     , typeName: 'text'   },
            {name: 'creado_en'        , typeName: 'timestamp'  },
            {name: 'actualizado_en'   , typeName: 'timestamp'  },

        ],         
        primaryKey: ['num_sincro'],
        constraints: [
            {constraintType: 'check', consName: 'estados_cola', expr: `estado IN ('${ESTADOS.PENDIENTE}', '${ESTADOS.EN_PROCESO}', '${ESTADOS.PROCESADO}', '${ESTADOS.ERROR}', '${ESTADOS.AGOTADO}')`},
            {constraintType: 'check', consName: 'acciones_cola', expr: `accion IN ('${ACCIONES.DESACTIVAR}', '${ACCIONES.ACTUALIZAR}')`},
        ],
    };
}
