"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades";
import {año} from "./table-annios"

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
export function politicaNovedadesComun(alias:string){
    return `( 
                SELECT puede_cargar_todo FROM usuarios INNER JOIN roles USING (rol) WHERE usuario = get_app_user()
            ) OR (
                SELECT puede_cargar_propio FROM usuarios INNER JOIN roles USING (rol) WHERE usuario = get_app_user() and idper = ${alias}.idper
            ) OR (
                SELECT sector_pertenece(
                    (SELECT sector FROM personas WHERE idper = ${alias}.idper),
                    (SELECT sector 
                        FROM personas INNER JOIN usuarios USING (idper) 
                        WHERE usuario = get_app_user() AND idper <> ${alias}.idper)
                )
                AND (
                    SELECT puede_cargar_dependientes FROM usuarios INNER JOIN roles USING (rol) WHERE usuario = get_app_user()
                )
            )
        `;
}

export function politicaNovedades(alias:string, nombreFecha:string){
    var politicaModficacion = `(${politicaNovedadesComun(alias)})
        AND (
            (${nombreFecha} 
                >= (SELECT fecha_actual FROM parametros WHERE unico_registro)
            )
            OR (
                SELECT puede_cargar_todo FROM usuarios INNER JOIN roles USING (rol) WHERE usuario = get_app_user()
            )
        )
    `
    var politicaVisibilidad = `${politicaNovedadesComun(alias)}
        OR (
            SELECT true FROM usuarios INNER JOIN roles USING (rol) WHERE usuario = get_app_user() and idper = ${alias}.idper
        )`
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
            {name: 'habiles'  , typeName: 'integer'   , inTable:false, serverSide:true, editable:false },
        ],         
        primaryKey: [idper.name, 'desde', idr.name],
        foreignKeys: [
            {references: 'annios'  , fields: [año.name], onUpdate: 'no action'},
            {references: 'personas', fields: [idper.name], displayFields:['apellido', 'nombres', 'idmeta4', 'cuil', 'ficha']},
            {references: 'cod_novedades', fields: [cod_nov.name]},
            {references: 'fechas', fields: [{source:'desde', target:'fecha'}], alias:'desde'},
            {references: 'fechas', fields: [{source:'hasta', target:'fecha'}], alias:'hasta'},
        ],
        constraints: [
            {constraintType:'check', consName:'desde y hasta deben ser del mismo annio', expr:`extract(year from desde) is not distinct from extract(year from desde)`},
            {constraintType:'check', consName:'cod_nov obligatorio si no cancela', expr:'(cod_nov is null) = (cancela is true)'},
        ],
        hiddenColumns: [idr.name],
        sql:{
            policies: politicaNovedades('novedades_registradas', 'desde'),
            fields: {
                habiles:{ expr:`(
                    select count(*) filter(where extract(dow from fecha) between 1 and 5
                        and laborable is not false)
                    from fechas as fechas_habiles
                    where fecha between novedades_registradas.desde and novedades_registradas.hasta
                )`},
            },
        }
    };
}
