"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

import {cuil} from "./table-personal"
import {cod_nov} from "./table-cod_novedades";
import {año} from "./table-annios"

export const idr: FieldDefinition = {name: 'idr', typeName: 'bigint', description: 'identificador de la novedad registrada'}

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
            {...idr, sequence:{name:'idr_seq', firstValue:1001}, nullable:true, editable:false },
            cod_nov,
            {name: 'dds1'     , typeName: 'boolean', title:'lunes'                      },
            {name: 'dds2'     , typeName: 'boolean', title:'martes'                     },
            {name: 'dds3'     , typeName: 'boolean', title:'miércoles'                  },
            {name: 'dds4'     , typeName: 'boolean', title:'jueves'                     },
            {name: 'dds5'     , typeName: 'boolean', title:'viernes'                    },
            {...año, editable:false, generatedAs:`extract(year from desde)`}
        ],         
        primaryKey: [cuil.name, 'desde', idr.name],
        foreignKeys: [
            {references: 'annios'  , fields: [año.name], onUpdate: 'no action'},
            {references: 'personal', fields: [cuil.name]},
        ],
        constraints: [
            {constraintType:'check', consName:'desde y hasta deben ser del mismo annio', expr:`extract(year from desde) is not distinct from extract(year from desde)`}
        ],
        hiddenColumns: [idr.name]
    };
}
