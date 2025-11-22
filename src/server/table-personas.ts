"use strict";

import {FieldDefinition, TableDefinition, TableContext, soloDigitosCons, soloDigitosPostConfig, soloCodigo, soloMayusculas} from "./types-principal";

import { s_revista  } from "./table-situacion_revista";
import { agrupamiento  } from "./table-agrupamientos";
import { perfil_sgc  } from "./table-perfiles_sgc";
import { banda_horaria  } from "./table-bandas_horarias";
import {sector} from "./table-sectores";
import { max_nivel_ed, nivel_educativo } from "./table-niveles_educativos";
import { horario } from "./table-horarios_cod"


import { politicaNovedades } from "./table-novedades_registradas";

export const idper: FieldDefinition = {
    name: 'idper', 
    typeName: 'text', 
    title: 'idper',
    postInput: 'upperWithoutDiacritics',
}

export const s_revista_personas = {
  ...s_revista,
  inTable: false,
  editable:false,
};

export const agrupamiento_personas = {
  ...agrupamiento,
  inTable: false,
  editable:false,
};

export const bh_personas = {
  ...banda_horaria,
  title: 'banda horaria',
};

export const sqlPersonas= `
SELECT p.*, t.categoria, t.situacion_revista, 
        t.motivo_egreso, t.jerarquia, t.cargo_atgc, t.agrupamiento, t.tramo, t.grado,
        h.horario
    FROM personas p
        LEFT JOIN LATERAL (SELECT * 
                    FROM trayectoria_laboral tl
                    WHERE propio AND tl.idper = p.idper
                    ORDER BY desde DESC, idt DESC
                    LIMIT 1) t ON TRUE
        LEFT JOIN LATERAL (SELECT horario FROM horarios_per hp WHERE hp.idper = p.idper AND hp.lapso_fechas @> /*incluye*/ fecha_actual()) h ON TRUE
`;

export function personas(context: TableContext): TableDefinition {
    var {es} = context;
    return {
        name: 'personas',
        elementName: 'persona',
        editable: es.rrhh,
        fields:[
            {...idper, nullable:true, editable:false, grupo:'identif'},
            {name: 'cuil'     , typeName: 'text', isName:false, grupo:'identif', postInput: soloDigitosPostConfig, clientSide: 'cuil_style', serverSide:true, inTable:true },
            {name: 'tipo_doc' , typeName: 'text',               grupo:'identif',                                    },
            {name: 'documento', typeName: 'text', isName:false, grupo:'identif', postInput: soloDigitosPostConfig  },
            {name: 'ficha'    , typeName: 'text', isName:false, grupo:'identif',                                   },
            {name: 'idmeta4'  , typeName: 'text', isName:false, grupo:'identif', title:'id meta4'                  },
            {name: 'apellido' , typeName: 'text', isName:true , grupo:'persona', nullable:false                    },
            {name: 'nombres'  , typeName: 'text', isName:true , grupo:'persona', nullable:false                    },
            {...sector,                                         grupo:'funcion', },
            {name: 'es_jefe'  , typeName: 'boolean'                                               },
            {name: 'categoria', typeName: 'text', title:'categoría', inTable:false, editable:false},
            s_revista_personas,
            {name: 'registra_novedades_desde', typeName: 'date'                                   },
            {name: 'para_antiguedad_relativa', typeName: 'date', title: 'para antigüedad relativa'},
            {name: 'activo' , typeName: 'boolean', nullable:false , defaultValue:false            },
            {name: 'fecha_ingreso'           , typeName: 'date'                                   },
            {name: 'fecha_egreso'            , typeName: 'date'                                   },
            {name: 'motivo_egreso'           , typeName: 'text', title: 'motivo de egreso', inTable:false, editable:false},
            {name: 'nacionalidad'            , typeName: 'text', title: 'nacionalidad'            },
            {name: 'jerarquia'               , typeName: 'text', title: 'jerarquía', inTable:false, editable:false},
            {name: 'cargo_atgc'              , typeName: 'text', title: 'cargo/ATGC', inTable:false, editable:false},
            agrupamiento_personas,
            {name: 'tramo'                   , typeName: 'text', title: 'tramo', inTable:false, editable:false    },
            {name: 'grado'                   , typeName: 'text', title: 'grado', inTable:false, editable:false    },
            {name: 'fecha_nacimiento'        , typeName: 'date', title: 'fecha nacimiento'        },
            {name: 'sexo'                    , typeName: 'text', title: 'sexo'                    },
            {name: 'cuil_valido'             , typeName: 'boolean', title: 'cuil válido', inTable:false, serverSide:true, editable:false},
            perfil_sgc,
            max_nivel_ed,
            {...horario, inTable:false},
            bh_personas,
        ],
        primaryKey: [idper.name],
        foreignKeys: [
            {references: 'sectores'         , fields:[sector.name]         },
            {references: 'paises'           , fields:[{source:'nacionalidad',target:'pais'}]      },
            {references: 'sexos'              , fields:['sexo']            },
            {references: 'tipos_doc'          , fields:['tipo_doc']        },
            {references: 'bandas_horarias'    , fields:[bh_personas.name]  },
            {references: 'perfiles_sgc'       , fields:[perfil_sgc.name]   },
            {references: 'niveles_educativos' , fields:[{source:'max_nivel_ed',target:nivel_educativo.name}] },
        ],
        softForeignKeys: [
            {references: 'jerarquias'      , fields:['jerarquia']     },
            {references: 'motivos_egreso'  , fields:['motivo_egreso'] },
            {references: 'categorias'      , fields:['categoria']     },
            {references: 'agrupamientos'   , fields:[agrupamiento_personas.name]},
            {references: 'grados'          , fields:['tramo','grado'] },
        ],
        constraints: [
            soloCodigo(idper.name),
            soloDigitosCons('cuil'   ),
            soloDigitosCons('documento'),
            soloDigitosCons('ficha'  ),
            soloDigitosCons('idmeta4'),
            soloMayusculas('tipo_doc'),
            {constraintType:'unique', consName:'nombre y apellidos sin repetir', fields:['apellido', 'nombres']}
        ],
        detailTables: [
            {table:'novedades_vigentes'   , fields:[idper.name], abr:'N'},
            {table:'novedades_registradas', fields:[idper.name], abr:'R'},
            {table:'fichadas'             , fields:[idper.name], abr:'F'},
            {table:'nov_per'              , fields:[idper.name], abr:'#'},
            {table:'per_nov_cant'         , fields:[idper.name], abr:'##'},
            {table:'trayectoria_laboral'  , fields:[idper.name], abr:'tl', refreshFromParent:true, refreshParent:true},
            {table:'inconsistencias'      , fields:[idper.name], abr:'⒤', refreshFromParent:true},
            {table:'per_capa'   , fields:[idper.name], abr:'C'},
            {table:'per_domicilios', fields:[idper.name], abr:'D'},
            {table:'per_telefonos' , fields:[idper.name], abr:'T'},
            {table:'horarios_per'  , fields:[idper.name], abr:'h'},
            {table:'adjuntos'   , fields:[idper.name], abr:'A'},
        ],
        sql: {
            isTable: true,
            policies: politicaNovedades('personas', 'registra_novedades_desde'),
            fields: {
                cuil_valido:{ expr:`validar_cuit(cuil)` },
            },
            // where: es.rrhh ? 'true' : es.registra ? `personas.activo AND sector_pertenece(personas.sector, ${quoteLiteral(user.sector)})` : `personas.idper = ${quoteLiteral(user.idper)}`
            from:`(${sqlPersonas})`
        },
        hiddenColumns: ['cuil_valido'],
        sortColumns: [{column: 'activo', order: -1}, {column: 'idper', order: 1}],
    };
}
