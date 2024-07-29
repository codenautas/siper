"use strict";

import {TableDefinition, TableContext} from "./types-principal";

export function novedades(context:TableContext):TableDefinition{
    var admin = context.user.rol==='admin';
    return {
        name:'novedades',
        elementName:'novedad',
        editable:admin,
        fields:[
            {name: 'cuil'     , typeName: 'text'   ,                                    },
            {name: 'ficha'    , typeName: 'text'   ,                                    },
            {name: 'fecha'    , typeName: 'date'   ,                                    },
            {name: 'dds'      , typeName: 'text'   , inTable:false, serverSide:true, editable:false },
            {name: 'novedad'  , typeName: 'text'   ,                                    },
            {name: 'sector'   , typeName: 'text'   ,                                    },
            {name: 'ent_fich' , typeName: 'text'   , title:'entrada - fichada'          },
            {name: 'sal_fich' , typeName: 'text'   , title:'salida - fichada'           },
            {name: 'annio'    , typeName: 'integer', inTable:false, serverSide:true, editable:false },
        ],
        primaryKey:['cuil', 'fecha', 'novedad'],
        foreignKeys:[
            {references:'personal'     , fields:['cuil'   ]},
            {references:'fechas'       , fields:['fecha'  ]},
            {references:'sectores'     , fields:['sector' ]},
            {references:'motivos', fields:['novedad']},
        ],
        sql:{
            fields:{
                dds:{ expr:`case extract(dow from novedades.fecha) when 0 then 'domingo' when 1 then 'lunes' when 2 then 'martes' when 3 then 'miércoles' when 4 then 'jueves'when 5 then 'viernes' when 6 then 'sábado' end`},
                annio:{ expr:`extract(year from novedades.fecha)`},
            }
        },
        hiddenColumns:['annio']
    };
}
