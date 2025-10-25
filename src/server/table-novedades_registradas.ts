"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades";
import {año} from "./table-annios"
import {tipo_novedad} from "./table-tipos_novedad";
import { constraintsFechasDesdeHasta } from "./table-fechas";

export const idr: FieldDefinition = {name: 'idr', typeName: 'bigint', description: 'identificador de la novedad registrada'}
/*
    policies?:{
        all   ?:{using?:string, check?:string}
        select?:{using?:string}
        insert?:{               check?:string}
        update?:{using?:string, check?:string}
        delete?:{using?:string}
    }
*/
export function politicaNovedadesComun(alias:string, cargarOver:'cargar'|'ver'){
    const tieneSector:boolean = alias == 'personas';
    return `( -- PUEDE TODO:
                SELECT puede_${cargarOver}_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_${cargarOver}_propio FROM roles WHERE rol = get_app_user('rol') AND ${alias}.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_${cargarOver}_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        ${tieneSector?`sector`:`(SELECT sector FROM personas WHERE idper = ${alias}.idper)`},
                        get_app_user('sector')
                    )
                )
            )
        `;
}

export function politicaNovedades(alias:string, nombreFecha:string){
    var politicaModficacion = `(${politicaNovedadesComun(alias, 'cargar')})`
    + ((alias == 'personas' || alias == 'trayectoria_laboral') ? '' : ` AND (
            (${nombreFecha} 
                >= (SELECT fecha_actual FROM parametros WHERE unico_registro)
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
    `)
    var politicaVisibilidad = politicaNovedadesComun(alias, 'ver');
    if (alias == 'personas' || alias == 'trayectoria_laboral') {
        politicaVisibilidad = `(case when get_app_user('mode') = 'login' then true else ${politicaVisibilidad} end)`;
    }
    return {
        select: {
            using: politicaVisibilidad
        },
        insert: {
            check: politicaModficacion
        },
        update: {
            using: politicaModficacion
        },
        delete: {
            using: politicaModficacion
        }
    }
}

export function novedades_registradas(_context: TableContext): TableDefinition{
    return {
        name: 'novedades_registradas',
        elementName: 'novedad registrada',
        editable: true,
        fields:[
            idper,
            {name: 'desde'    , typeName: 'date'   ,                                    },
            {name: 'hasta'    , typeName: 'date'   ,                                    },
            {...idr, sequence:{name:'idr_seq', firstValue:1001}, nullable:true, editable:false },
            cod_nov,
            {name: 'dds0'     , typeName: 'boolean', title:'domingo'                    },
            {name: 'dds1'     , typeName: 'boolean', title:'lunes'                      },
            {name: 'dds2'     , typeName: 'boolean', title:'martes'                     },
            {name: 'dds3'     , typeName: 'boolean', title:'miércoles'                  },
            {name: 'dds4'     , typeName: 'boolean', title:'jueves'                     },
            {name: 'dds5'     , typeName: 'boolean', title:'viernes'                    },
            {name: 'dds6'     , typeName: 'boolean', title:'sabado'                     },
            {...año, editable:false, generatedAs:`extract(year from desde)`},
            {name: 'cancela'  , typeName: 'boolean', description:'cancelación de novedades'},
            {name: 'detalles' , typeName: 'text'   ,                                    },
            {name: 'dias_hoc' , typeName: 'text', inTable:false, serverSide:true, editable:false },
            {name: 'fecha'    , typeName: 'date'   ,                                    },
            {name: 'usuario'  , typeName: 'text'   ,                                    },
            tipo_novedad,
        ],         
        primaryKey: [idper.name, 'desde', idr.name],
        foreignKeys: [
            {references: 'annios'  , fields: [año.name], onUpdate: 'no action'},
            {references: 'personas', fields: [idper.name], displayFields:['apellido', 'nombres', 'idmeta4', 'cuil', 'ficha']},
            {references: 'cod_novedades', fields: [cod_nov.name]},
            {references: 'fechas', fields: [{source:'desde', target:'fecha'}], alias:'desde'},
            {references: 'fechas', fields: [{source:'hasta', target:'fecha'}], alias:'hasta'},
            {references: 'tipos_novedad', fields: [tipo_novedad.name], displayFields:['orden', 'descripcion']},
        ],
        constraints: [
            ...constraintsFechasDesdeHasta(),
            {constraintType:'check', consName:'cod_nov obligatorio si no cancela', expr:'(cod_nov is null) = (cancela is true)'},
        ],
        hiddenColumns: [idr.name],
        sql:{
            policies: politicaNovedades('novedades_registradas', 'desde'),
            fields: {
                dias_hoc:{ expr:`(
                    WITH dias AS (
                        SELECT 
                            COUNT(*) AS dias_corridos,
                            COUNT(*) FILTER (
                                WHERE extract(dow FROM fecha) BETWEEN 1 AND 5
                                AND laborable IS NOT FALSE
                            ) AS dias_habiles
                        FROM fechas
                        WHERE fecha BETWEEN novedades_registradas.desde AND novedades_registradas.hasta
                    )
                    SELECT 
                        CASE 
                            WHEN (SELECT corridos FROM cod_novedades WHERE cod_nov = novedades_registradas.cod_nov) IS TRUE 
                            THEN CONCAT(dias_corridos, 'c')
                            ELSE CONCAT(dias_habiles, 'h')
                        END
                    FROM dias
                )`},
            },
        }
    };
}
