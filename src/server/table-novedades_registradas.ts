"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {cuil} from "./table-personal"
import {cod_nov} from "./table-cod_novedades";

export function novedades_registradas(context: TableContext): TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'novedades_registradas',
        elementName: 'registro',
        editable: admin,
        fields:[
            cuil,
            {name: 'desde'    , typeName: 'date'   ,                                    },
            {name: 'hasta'    , typeName: 'date'   ,                                    },
            cod_nov,
            {name: 'dds1'     , typeName: 'boolean', title:'lunes'                      },
            {name: 'dds2'     , typeName: 'boolean', title:'martes'                     },
            {name: 'dds3'     , typeName: 'boolean', title:'miércoles'                  },
            {name: 'dds4'     , typeName: 'boolean', title:'jueves'                     },
            {name: 'dds5'     , typeName: 'boolean', title:'viernes'                    },
        ],         
        primaryKey: [cuil.name, 'desde', cod_nov.name],
        foreignKeys: [
            {references: 'personal', fields: [cuil.name]}
        ]
    };
}
