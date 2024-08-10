"use strict";

import {FieldDefinition, TableDefinition, TableContext, soloDigitosCons, soloDigitosPostConfig} from "./types-principal";

export const cuil: FieldDefinition = {
    name: 'cuil', 
    typeName: 'text', 
    title: 'CUIL', 
    postInput: soloDigitosPostConfig
}

export function personal(context: TableContext): TableDefinition {
    var admin = context.user.rol==='admin';
    return {
        name: 'personal',
        elementName: 'persona',
        editable: admin,
        fields:[
            cuil,
            {name: 'ficha'    , typeName: 'text', isName:true,                                   },
            {name: 'idmeta4'  , typeName: 'text', isName:true, title:'id meta4'                  },
            {name: 'nomyape'  , typeName: 'text', isName:true, title:'nombre y apellido'         },
            {name: 'sector'   , typeName: 'text',                                                },
            {name: 'categoria', typeName: 'text',              title:'categoría'                 },
        ],
        primaryKey: [cuil.name],
        foreignKeys: [
            {references: 'sectores', fields:['sector']}
        ],
        constraints: [
            soloDigitosCons(cuil.name),
            soloDigitosCons('ficha'  ),
            soloDigitosCons('idmeta4'),
        ],
        detailTables: [
            {table:'novedades_vigentes'   , fields:[cuil.name], abr:'N'},
            {table:'novedades_registradas', fields:[cuil.name], abr:'R'},
            {table:'nov_per'              , fields:[cuil.name], abr:'#'}
        ]
    };
}
