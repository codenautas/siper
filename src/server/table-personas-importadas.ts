"use strict";

import {TableDefinition, TableContext, idImportacion} from "./types-principal";

export function personas_importadas(context: TableContext): TableDefinition {
    var admin = context.es.admin;
    return {
        name: 'personas_importadas',
        elementName: 'persona',
        editable: admin,
        fields:[
            idImportacion,
            {name:'ficha'                , typeName:'text', title: 'Ficha'                },
            {name:'documento'            , typeName:'text', title: 'Documento'            },
            {name:'cuil'                 , typeName:'text', title: 'CUIL'                 },
            {name:'fecha_ingreso'        , typeName:'date', title: 'Fecha Ingreso'        },
            {name:'fecha_egreso'         , typeName:'date', title: 'Fecha Egreso'         },
            {name:'antiguedad'           , typeName:'text', title: 'Antiguedad'           },
            {name:'tarjeta'              , typeName:'text', title: 'Tarjeta'              },
            {name:'login'                , typeName:'text', title: 'Login'                },
            {name:'nacionalidad'         , typeName:'text', title: 'Nacionalidad'         },
            {name:'descripcion'          , typeName:'text', title: 'Descripcion'          },
            {name:'apellido'             , typeName:'text', title: 'Apellido'             },
            {name:'nombre'               , typeName:'text', title: 'Nombre'               },
            {name:'sexo'                 , typeName:'text', title: 'Sexo'                 },
            {name:'edad'                 , typeName:'text', title: 'Edad'                 },
            {name:'motivo_de_egreso'     , typeName:'text', title: 'Motivo de Egreso'     },
            {name:'reparticion'          , typeName:'text', title: 'Reparticion'          },
            {name:'oficina'              , typeName:'text', title: 'Oficina'              },
            {name:'jerarquia'            , typeName:'text', title: 'Jerarquia'            },
            {name:'cargo_/atgc'          , typeName:'text', title: 'Cargo /ATGC'          },
            {name:'agrupamiento'         , typeName:'text', title: 'Agrupamiento'         },
            {name:'tramo'                , typeName:'text', title: 'Tramo'                },
            {name:'grado'                , typeName:'text', title: 'Grado'                },
            {name:'categoria'            , typeName:'text', title: 'Categoria'            },
            {name:'situacion_revista'    , typeName:'text', title: 'Situacion de Revista' },
            {name:'fecha_inicio_cargo'   , typeName:'date', title: 'Fecha Inicio Cargo'   },
            {name:'fecha_fin_cargo'      , typeName:'date', title: 'Fecha Fin Cargo'      },
            {name:'horario'              , typeName:'text', title: 'Horario'              },
            {name:'domicilio'            , typeName:'text', title: 'Domicilio'            },
            {name:'funcion'              , typeName:'text', title: 'Funcion'              },
            {name:'codigo_funcion'       , typeName:'text', title: 'Codigo Funcion'       },
            {name:'estudio'              , typeName:'text', title: 'Estudio'              },
            {name:'id_meta_4'            , typeName:'text', title: 'ID Meta 4'            },
            {name:'fecha_nacimiento'     , typeName:'date', title: 'Fecha Nacimiento'     },
            {name:'nivelestudio'         , typeName:'text', title: 'NivelEstudio'         },
            {name:'comu_descripcion'     , typeName:'text', title: 'comu_Descripcion'     },
        ],
        primaryKey: [idImportacion.name],
    };
}
