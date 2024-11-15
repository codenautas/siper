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
            {name: 'documento', typeName: 'text', isName:false, postInput: soloDigitosPostConfig  },
            {name: 'ficha'    , typeName: 'text', isName:true ,                                   },
            {name: 'idmeta4'  , typeName: 'text', isName:false, title:'id meta4'                  },
            {name: 'apellido' , typeName: 'text', isName:true , nullable:false                    },
            {name: 'nombres'  , typeName: 'text', isName:true , nullable:false                    },
            {name: 'sector'   , typeName: 'text',                                                 },
            {name: 'categoria', typeName: 'text',               title:'categoría'                 },
            {name: 'registra_novedades_desde', typeName: 'date'                                   },
            {name: 'para_antiguedad_relativa', typeName: 'date'                                   },
            {name: 'activo'                  , typeName: 'boolean'                                },
            {name: 'ultimo_dia_trabajo'      , typeName: 'date'                                   },
            {name: 'nacionalidad'            , typeName: 'text', title: 'Nacionalidad'            },
            {name: 'jerarquia'               , typeName: 'text', title: 'Jerarquia'               },
            {name: 'cargo_/atgc'             , typeName: 'text', title: 'Cargo /ATGC'             },
            {name: 'agrupamiento'            , typeName: 'text', title: 'Agrupamiento'            },
            {name: 'tramo'                   , typeName: 'text', title: 'Tramo'                   },
            {name: 'grado'                   , typeName: 'text', title: 'Grado'                   },
            {name: 'situacion_de_revista'    , typeName: 'text', title: 'Situacion de Revista'    },
            {name: 'domicilio'               , typeName: 'text', title: 'Domicilio'               },
            {name: 'fecha_nacimiento'        , typeName: 'date', title: 'Fecha Nacimiento'        },
            {name: 'comu_descripcion'        , typeName: 'text', title: 'comu_Descripcion'        },
        ],
        primaryKey: [idper.name],
        foreignKeys: [
            {references: 'sectores', fields:['sector']}
        ],
        constraints: [
            soloCodigo(idper.name),
            soloDigitosCons('cuil'   ),
            soloDigitosCons('documento'),
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
