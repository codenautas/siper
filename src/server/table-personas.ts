"use strict";

import {FieldDefinition, TableDefinition, TableContext, soloDigitosCons, soloDigitosPostConfig, soloCodigo} from "./types-principal";

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
            {name: 'cuil'     , typeName: 'text', isName:false, postInput: soloDigitosPostConfig  },
            {name: 'ficha'    , typeName: 'text', isName:true ,                                   },
            {name: 'idmeta4'  , typeName: 'text', isName:false, title:'id meta4'                  },
            {name: 'apellido' , typeName: 'text', isName:false, nullable:false                    },
            {name: 'nombres'  , typeName: 'text', isName:false, nullable:false                    },
            {name: 'sector'   , typeName: 'text',                                                 },
            {name: 'categoria', typeName: 'text',               title:'categoría'                 },
        ],
        primaryKey: [idper.name],
        foreignKeys: [
            {references: 'sectores', fields:['sector']}
        ],
        constraints: [
            soloCodigo(idper.name),
            soloDigitosCons('cuil'   ),
            soloDigitosCons('ficha'  ),
            soloDigitosCons('idmeta4'),
            {constraintType:'unique', consName:'nombre y apellidos sin repetir', fields:['apellido', 'nombres']}
        ],
        detailTables: [
            {table:'novedades_vigentes'   , fields:[idper.name], abr:'N'},
            {table:'novedades_registradas', fields:[idper.name], abr:'R'},
            {table:'nov_per'              , fields:[idper.name], abr:'#'}
        ]
    };
}
