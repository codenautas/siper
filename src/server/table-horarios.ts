"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {annio} from "./table-annios"

export function horarios(context: TableContext): TableDefinition{
    var admin = context.es.rrhh;
    return {
        name: 'horarios',
        elementName: 'horario',
        title: 'horarios del personal',
        editable: admin,
        fields: [
            {...idper, editable:admin},
            {name: 'dds'             , typeName: 'integer'                   },
            {...annio, editable:false, generatedAs:`extract(year from desde)`  },
            {name: 'desde'           , typeName: 'date'    , nullable:false  },
            {name: 'hasta'           , typeName: 'date'    , nullable:false  },
            {name: 'trabaja'         , typeName: 'boolean' , nullable:false ,defaultValue:false},
            {name: 'hora_desde'      , typeName: 'time'    , nullable:false  },
            {name: 'hora_hasta'      , typeName: 'time'    , nullable:false  },
            {name: 'lapso_fechas'    , typeName: 'daterange', visible:false, generatedAs:'daterange(desde, coalesce(hasta, make_date(extract(year from desde)::integer, 12, 31)))'},
        ],
        primaryKey: [idper.name, 'dds', annio.name, 'desde'],
        softForeignKeys: [
            {references: 'personas', fields:[idper.name], onDelete:'cascade'},
            {references: 'annios'  , fields: [annio.name], onUpdate: 'no action'},
            {references: 'fechas'  , fields:[{source:'desde', target:'fecha'}], alias:'desde', onDelete:'cascade'},
            {references: 'fechas'  , fields:[{source:'hasta', target:'fecha'}], alias:'hasta', onDelete:'cascade'},
        ],
        sql:{
            isTable:false,
            viewBody:`select hp.idper, hd.dds, hp.annio, hp.desde, hp.hasta, hd.dds between 1 and 5 as trabaja, hd.hora_desde, hd.hora_hasta, hp.lapso_fechas
                from horarios_per hp 
                    inner join horarios_dds hd using (horario)
            `
        }
    };
}
