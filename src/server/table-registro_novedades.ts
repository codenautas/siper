"use strict";

import {TableDefinition, TableContext} from "./types-principal";

export function registro_novedades(context: TableContext): TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name: 'registro_novedades',
        elementName: 'registro',
        editable: admin,
        fields:[
            {name: 'cuil'     , typeName: 'text'   ,                                    },
            {name: 'desde'    , typeName: 'date'   ,                                    },
            {name: 'hasta'    , typeName: 'date'   ,                                    },
            {name: 'cod_nov'  , typeName: 'text'   ,                                    },
            {name: 'dds1'     , typeName: 'boolean', title:'lunes'                      },
            {name: 'dds2'     , typeName: 'boolean', title:'martes'                     },
            {name: 'dds3'     , typeName: 'boolean', title:'miércoles'                  },
            {name: 'dds4'     , typeName: 'boolean', title:'jueves'                     },
            {name: 'dds5'     , typeName: 'boolean', title:'viernes'                    },
        ],         
        primaryKey: ['cuil', 'desde', 'cod_nov']
    };
}
