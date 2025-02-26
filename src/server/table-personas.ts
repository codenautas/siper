"use strict";

import {FieldDefinition, TableDefinition, TableContext, soloDigitosCons, soloDigitosPostConfig, soloCodigo, soloMayusculas} from "./types-principal";

import { s_revista  } from "./table-situacion_revista";

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
            {name: 'tipo_doc' , typeName: 'text',                                                 },
            {name: 'documento', typeName: 'text', isName:false, postInput: soloDigitosPostConfig  },
            {name: 'ficha'    , typeName: 'text', isName:false,                                   },
            {name: 'idmeta4'  , typeName: 'text', isName:false, title:'id meta4'                  },
            {name: 'apellido' , typeName: 'text', isName:true , nullable:false                    },
            {name: 'nombres'  , typeName: 'text', isName:true , nullable:false                    },
            {name: 'sector'   , typeName: 'text',                                                 },
            {name: 'categoria', typeName: 'text',               title:'categoría'                 },
            s_revista,
            {name: 'registra_novedades_desde', typeName: 'date'                                   },
            {name: 'para_antiguedad_relativa', typeName: 'date'                                   },
            {name: 'activo'                  , typeName: 'boolean'                                },
            {name: 'fecha_ingreso'           , typeName: 'date'                                   },
            {name: 'fecha_egreso'            , typeName: 'date'                                   },
            {name: 'nacionalidad'            , typeName: 'text', title: 'nacionalidad'            },
            {name: 'jerarquia'               , typeName: 'text', title: 'jerarquía'               },
            {name: 'cargo_atgc'              , typeName: 'text', title: 'cargo/ATGC'              },
            {name: 'agrupamiento'            , typeName: 'text', title: 'agrupamiento'            },
            {name: 'tramo'                   , typeName: 'text', title: 'tramo'                   },
            {name: 'grado'                   , typeName: 'text', title: 'grado'                   },
            {name: 'domicilio'               , typeName: 'text', title: 'domicilio'               },
            {name: 'fecha_nacimiento'        , typeName: 'date', title: 'fecha nacimiento'        },
            {name: 'es_jefe'                 , typeName: 'boolean'                                },
        ],
        primaryKey: [idper.name],
        foreignKeys: [
            {references: 'sectores'         , fields:['sector']       },
            {references: 'paises'           , fields:[{source:'nacionalidad',target:'pais'}]      },
            {references: 'categorias'         , fields:['categoria']       },
        ],
        softForeignKeys: [
            {references: 'situacion_revista', fields:[s_revista.name] },
        ],
        constraints: [
            soloCodigo(idper.name),
            soloDigitosCons('cuil'   ),
            soloDigitosCons('documento'),
            soloDigitosCons('ficha'  ),
            soloDigitosCons('idmeta4'),
            soloMayusculas(s_revista.name),
            soloMayusculas('tipo_doc'),
            {constraintType:'unique', consName:'nombre y apellidos sin repetir', fields:['apellido', 'nombres']}
        ],
        detailTables: [
            {table:'novedades_vigentes'   , fields:[idper.name], abr:'N'},
            {table:'novedades_registradas', fields:[idper.name], abr:'R'},
            {table:'fichadas'             , fields:[idper.name], abr:'F'},
            {table:'nov_per'              , fields:[idper.name], abr:'#'},
            {table:'historial_contrataciones', fields:[idper.name], abr:'hc'},
            {table:'inconsistencias'      , fields:[idper.name], abr:'⒤'},
            {table:'per_capa'   , fields:[idper.name], abr:'C'},
        ]
    };
}
