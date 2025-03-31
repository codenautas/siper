"use strict";

import {TableDefinition, TableContext} from "./types-principal";

export const PERMISOS_COLUMNA = ['ver', 'cambiar'];

export function permisos_columnas(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'permisos_columnas',
        elementName: 'permiso de columna',
        editable: admin,
        prefix:'pc', // están prefijados con "pc_" para hacer más fácil el refator posterior de los permisos
        fields: [
            {name: 'pc_tabla'                 , typeName: 'text'   },
            {name: 'pc_columna'               , typeName: 'text'   },
            {name: 'ficha_grupo'              , typeName: 'text'   },
            {name: 'ficha_orden'              , typeName: 'integer'},
            {name: 'pc_configurable'          , typeName: 'boolean', defaultValue:true, allow: {select: context.es.configurador}},
            {name: 'pc_basico_suyo'           , typeName: 'text'   , options: PERMISOS_COLUMNA},
            {name: 'pc_basico_otro'           , typeName: 'text'   , options: PERMISOS_COLUMNA},
            {name: 'pc_registra_suyo'         , typeName: 'text'   , options: PERMISOS_COLUMNA},
            {name: 'pc_registra_otro'         , typeName: 'text'   , options: PERMISOS_COLUMNA},
            {name: 'pc_rrhh_suyo'             , typeName: 'text'   , options: PERMISOS_COLUMNA},
            {name: 'pc_rrhh_otro'             , typeName: 'text'   , options: PERMISOS_COLUMNA},
        ],
        primaryKey: ['pc_tabla', 'pc_columna'],
        sql:{
            policies:{
                all:{using:`(SELECT usuarios.rol = 'configurador' OR pc_configurable FROM usuarios INNER JOIN roles USING (rol) WHERE usuario = get_app_user())`}
            }
        },
        sortColumns:[{column:'ficha_grupo'}, {column:'ficha_orden'}, {column:'pc_tabla'}, {column:'pc_columna'}]
    };
}