"use strict";

import {TableDefinition, TableContext, FieldDefinition, sinEspaciosMail } from "./types-principal";

import {idper} from "./table-personas"
import {rol} from "./table-roles"

export function usuarios(context: TableContext): TableDefinition{
    var es = context.es;
    var rolConPermisos = es.rrhh || context.forDump;
    return {
        name: 'usuarios',
        title: 'usuarios de la aplicación',
        editable: rolConPermisos,
        fields: [
            {name:'usuario'                       , typeName:'text'    , nullable:false  },
            {name: rol.name                       , typeName:'text'    },
            {name:'hashpass'                      , typeName:'text'    , allow:{select: context.forDump} },
            {name:'activo'                        , typeName:'boolean' , nullable:false ,defaultValue:false},
            {name:'nombre'                        , typeName:'text'                      },
            {name:'apellido'                      , typeName:'text'                      },
            {name:'ultima_actualizacion_password' , typeName:'timestamp', editable:false },
            {name:'telefono'                      , typeName:'text'    , title:'teléfono'},
            {name:'interno'                       , typeName:'text'                      },
            {name:'mail'                          , typeName:'text'                      },
            {name:'mail_alternativo'              , typeName:'text'                      },
            ...(rolConPermisos? [
                {name:'clave_nueva'      , typeName:'text', clientSide:'newPass', allow:{select:rolConPermisos, update:true, insert:false}} satisfies FieldDefinition,
            ]: []),
            {...idper, editable:rolConPermisos},
            {name:'principal'                     , typeName:'boolean' ,defaultValue:true},
            {name:'sector', typeName:'text', editable:false, serverSide:true, inTable:false},
            {name:'nombre_sector', typeName:'text', editable:false, serverSide:true, inTable:false},
            {name:'algoritmo_pass'                , typeName:'text'     , editable:false },
            
        ],
        primaryKey: ['usuario'],
        foreignKeys: [
            {references: 'personas', fields:[idper.name]},
            {references: 'roles'   , fields:[rol.name  ], onUpdate: 'no action'},
        ],
        hiddenColumns:['algoritmo_pass'],
        constraints: [
            sinEspaciosMail('mail'),sinEspaciosMail('mail_alternativo'),
            {constraintType: 'check', consName: 'los usuarios de mantenimiento no pueden tener persona asociada', expr:`idper is null OR rol is distinct from 'admin'`}
        ],
        sql: {
            where: (
                es.admin || context.forDump ? 'true' :
                rolConPermisos ? `usuarios.rol is distinct from 'admin'` :
                "usuario = "+context.be.db.quoteNullable(context.user.usuario)),
            fields: {
                sector: {expr: `(select p.sector from personas p where p.idper = usuarios.idper)`},
                nombre_sector: {expr: `(select s.nombre_sector from sectores s where s.sector = (select p.sector from personas p where p.idper = usuarios.idper))`},
            },
        }
    };
}

