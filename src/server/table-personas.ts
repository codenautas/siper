"use strict";

import {FieldDefinition, TableDefinition, TableContext, soloDigitosCons, soloDigitosPostConfig, soloCodigo, soloMayusculas} from "./types-principal";

import { s_revista  } from "./table-situacion_revista";
import { agrupamiento  } from "./table-agrupamientos";
import { puesto  } from "./table-puestos";

import { politicaNovedades } from "./table-novedades_registradas";

export const idper: FieldDefinition = {
    name: 'idper', 
    typeName: 'text', 
    title: 'idper',
    postInput: 'upperWithoutDiacritics',
}

export function personas(context: TableContext): TableDefinition {
    var {es} = context;
    return {
        name: 'personas',
        elementName: 'persona',
        editable: es.rrhh,
        fields:[
            {...idper, nullable:true, editable:false},
            {name: 'cuil'     , typeName: 'text', isName:false, postInput: soloDigitosPostConfig, clientSide: 'cuil_style', serverSide:true, inTable:true },
            {name: 'tipo_doc' , typeName: 'text',                                                 },
            {name: 'documento', typeName: 'text', isName:false, postInput: soloDigitosPostConfig  },
            {name: 'ficha'    , typeName: 'text', isName:false,                                   },
            {name: 'idmeta4'  , typeName: 'text', isName:false, title:'id meta4'                  },
            {name: 'apellido' , typeName: 'text', isName:true , nullable:false                    },
            {name: 'nombres'  , typeName: 'text', isName:true , nullable:false                    },
            {name: 'sector'   , typeName: 'text',                                                 },
            {name: 'es_jefe'  , typeName: 'boolean'                                               },
            {name: 'categoria', typeName: 'text',               title:'categoría'                 },
            s_revista,
            {name: 'registra_novedades_desde', typeName: 'date'                                   },
            {name: 'para_antiguedad_relativa', typeName: 'date', title: 'para antigüedad relativa'},
            {name: 'activo' , typeName: 'boolean', nullable:false , defaultValue:false            },
            {name: 'fecha_ingreso'           , typeName: 'date'                                   },
            {name: 'fecha_egreso'            , typeName: 'date'                                   },
            {name: 'motivo_egreso'           , typeName: 'text', title: 'motivo de egreso'       },
            {name: 'nacionalidad'            , typeName: 'text', title: 'nacionalidad'            },
            {name: 'jerarquia'               , typeName: 'text', title: 'jerarquía'               },
            {name: 'cargo_atgc'              , typeName: 'text', title: 'cargo/ATGC'              },
            agrupamiento,
            {name: 'tramo'                   , typeName: 'text', title: 'tramo'                   },
            {name: 'grado'                   , typeName: 'text', title: 'grado'                   },
            {name: 'fecha_nacimiento'        , typeName: 'date', title: 'fecha nacimiento'        },
            {name: 'sexo'                    , typeName: 'text', title: 'sexo'                    },
            {name: 'cuil_valido'             , typeName: 'boolean', title: 'cuil válido', inTable:false, serverSide:true, editable:false},
            puesto,
            {name: 'banda_horaria'           , typeName: 'text', title: 'banda horaria'           },
        ],
        primaryKey: [idper.name],
        foreignKeys: [
            {references: 'sectores'         , fields:['sector']       },
            {references: 'paises'           , fields:[{source:'nacionalidad',target:'pais'}]      },
            {references: 'categorias'         , fields:['categoria']       },
            {references: 'sexos'              , fields:['sexo']            },
            {references: 'jerarquias'         , fields:['jerarquia']       },
            {references: 'motivos_egreso'     , fields:['motivo_egreso']   },
            {references: 'tipos_doc'          , fields:['tipo_doc']        },
            {references: 'situacion_revista', fields:[s_revista.name] },
            {references: 'agrupamientos'    , fields:[agrupamiento.name] },
            {references: 'grados'           , fields:['tramo','grado']     },
            {references: 'puestos'          , fields:[puesto.name] },
            {references: 'bandas_horarias'  , fields:['banda_horaria']     },
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
            {table:'per_nov_cant'         , fields:[idper.name], abr:'##'},
            {table:'historial_contrataciones', fields:[idper.name], abr:'hc'},
            {table:'inconsistencias'      , fields:[idper.name], abr:'⒤', refreshFromParent:true},
            {table:'per_capa'   , fields:[idper.name], abr:'C'},
            {table:'per_domicilios', fields:[idper.name], abr:'D'},
            {table:'per_telefonos' , fields:[idper.name], abr:'T'},
            {table:'adjuntos_persona'   , fields:[idper.name], abr:'A'},
        ],
        sql: {
            policies: politicaNovedades('personas', 'registra_novedades_desde'),
            fields: {
                cuil_valido:{ expr:`validar_cuit(cuil)` },
            },
            // where: es.rrhh ? 'true' : es.registra ? `personas.activo AND sector_pertenece(personas.sector, ${quoteLiteral(user.sector)})` : `personas.idper = ${quoteLiteral(user.idper)}`
        },
        hiddenColumns: ['cuil_valido'],
        sortColumns: [{column: 'activo', order: -1}, {column: 'idper', order: 1}],
    };
}
