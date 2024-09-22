"use strict";

import {FieldDefinition, TableDefinition, TableContext, soloDigitosCons, soloDigitosPostConfig} from "./types-principal";

export const idper: FieldDefinition = {
    name: 'idper', 
    typeName: 'text', 
    title: 'idper',
    postInput: 'upperWithoutDiacritics',
}

export function personas(context: TableContext): TableDefinition {
    var admin = context.user.rol==='admin' || context.user.rol==='rrhh';
    return {
        name: 'personas',
        elementName: 'persona',
        editable: admin,
        fields:[
            idper,
            {name: 'cuil'     , typeName: 'text', isName:false,postInput: soloDigitosPostConfig  },
            {name: 'ficha'    , typeName: 'text', isName:true,                                   },
            {name: 'idmeta4'  , typeName: 'text', isName:false,title:'id meta4'                  },
            {name: 'nomyape'  , typeName: 'text', isName:true, title:'nombre y apellido'         },
            {name: 'sector'   , typeName: 'text',                                                },
            {name: 'categoria', typeName: 'text',              title:'categoría'                 },
        ],
        primaryKey: [idper.name],
        foreignKeys: [
            {references: 'sectores', fields:['sector']}
        ],
        constraints: [
            soloDigitosCons(idper.name),
            soloDigitosCons('ficha'  ),
            soloDigitosCons('idmeta4'),
        ],
        detailTables: [
            {table:'novedades_vigentes'   , fields:[idper.name], abr:'N'},
            {table:'novedades_registradas', fields:[idper.name], abr:'R'},
            {table:'nov_per'              , fields:[idper.name], abr:'#'}
        ]
    };
}
