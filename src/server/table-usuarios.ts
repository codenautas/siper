"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {rol} from "./table-roles"

export function usuarios(context: TableContext): TableDefinition{
    var admin = context.user.rol==='admin';
    var rrhh = context.user.rol==='rrhh';
    var rolConPermisos = admin || rrhh || context.forDump;
    return {
        name: 'usuarios',
        title: 'usuarios de la aplicación',
        editable: rolConPermisos,
        fields: [
            {name:'usuario'          , typeName:'text'    , nullable:false  },
            {name: rol.name          , typeName:'text'    },
            {name:'md5clave'         , typeName:'text'    , allow:{select: context.forDump} },
            {name:'activo'           , typeName:'boolean' , nullable:false ,defaultValue:false},
            {name:'nombre'           , typeName:'text'                      },
            {name:'apellido'         , typeName:'text'                      },
            {name:'telefono'         , typeName:'text'    , title:'teléfono'},
            {name:'interno'          , typeName:'text'                      },
            {name:'mail'             , typeName:'text'                      },
            {name:'mail_alternativo' , typeName:'text'                      },
            ...(rolConPermisos? [
                {name:'clave_nueva'      , typeName:'text', clientSide:'newPass', allow:{select:rolConPermisos, update:true, insert:false}} satisfies FieldDefinition,
            ]: []),
            {...idper, editable:rolConPermisos},
            {name:'sector', typeName:'text', editable:false, serverSide:true, inTable:false},
            {name:'nombre_sector', typeName:'text', editable:false, serverSide:true, inTable:false},
        ],
        primaryKey: ['usuario'],
        foreignKeys: [
            {references: 'personas', fields:[idper.name]},
            {references: 'roles'   , fields:[rol.name ]},
        ],
        sql: {
            where:rolConPermisos || context.forDump?'true':"usuario = "+context.be.db.quoteNullable(context.user.usuario),
            fields: {
                sector: {expr: `(select p.sector from personas p where p.idper = usuarios.idper)`},
                nombre_sector: {expr: `(select s.nombre_sector from sectores s where s.sector = (select p.sector from personas p where p.idper = usuarios.idper))`},
            },
        }
    };
}
