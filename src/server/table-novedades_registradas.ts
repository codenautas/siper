"use strict";

import {FieldDefinition, TableDefinition, TableContext} from "./types-principal";

import {cuil} from "./table-personal"
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
export const politicaNovedades = {
    all: {
        using: `( 
            SELECT rol='admin' FROM usuarios WHERE usuario = get_app_user()
        ) OR (
            cuil = (SELECT cuil FROM usuarios WHERE usuario = get_app_user())
        ) OR (
            cuil in (SELECT cuilpersona
                      FROM (SELECT u.cuil cuiljefe, p.sector sectorjefe
                              FROM usuarios u
                              JOIN personal p ON u.cuil = p.cuil
                              WHERE u.rol = 'jefe' and u.usuario = get_app_user()) j,
                           (SELECT cuil cuilpersona, sector sectorpersona
                             FROM personal) d
                    WHERE sector_pertenece(sectorpersona, sectorjefe) and cuiljefe <> cuilpersona)
        )
    `
    },
    insert: {
        check: `( 
            SELECT rol='admin' FROM usuarios WHERE usuario = get_app_user()
        ) OR (
            cuil = (SELECT cuil FROM usuarios WHERE usuario = get_app_user())
        ) OR (
            cuil in (SELECT cuilpersona
                      FROM (SELECT u.cuil cuiljefe, p.sector sectorjefe
                              FROM usuarios u
                              JOIN personal p ON u.cuil = p.cuil
                              WHERE u.rol = 'jefe' and u.usuario = get_app_user()) j,
                           (SELECT cuil cuilpersona, sector sectorpersona
                             FROM personal) d
                    WHERE sector_pertenece(sectorpersona, sectorjefe) and cuiljefe <> cuilpersona)
        )
    `
    },
    update: {
        check: `( 
            SELECT rol='admin' FROM usuarios WHERE usuario = get_app_user()
        ) OR (
            cuil = (SELECT cuil FROM usuarios WHERE usuario = get_app_user())
        ) OR (
            cuil in (SELECT cuilpersona
                      FROM (SELECT u.cuil cuiljefe, p.sector sectorjefe
                              FROM usuarios u
                              JOIN personal p ON u.cuil = p.cuil
                              WHERE u.rol = 'jefe' and u.usuario = get_app_user()) j,
                           (SELECT cuil cuilpersona, sector sectorpersona
                             FROM personal) d
                    WHERE sector_pertenece(sectorpersona, sectorjefe) and cuiljefe <> cuilpersona)
        )
    `
    },
}

export function novedades_registradas(_context: TableContext): TableDefinition{
    return {
        name: 'novedades_registradas',
        elementName: 'registro',
        editable: true,
        fields:[
            cuil,
            {name: 'desde'    , typeName: 'date'   ,                                    },
            {name: 'hasta'    , typeName: 'date'   ,                                    },
            {...idr, sequence:{name:'idr_seq', firstValue:1001}, nullable:true, editable:false },
            cod_nov,
            {name: 'dds1'     , typeName: 'boolean', title:'lunes'                      },
            {name: 'dds2'     , typeName: 'boolean', title:'martes'                     },
            {name: 'dds3'     , typeName: 'boolean', title:'miércoles'                  },
            {name: 'dds4'     , typeName: 'boolean', title:'jueves'                     },
            {name: 'dds5'     , typeName: 'boolean', title:'viernes'                    },
            {...año, editable:false, generatedAs:`extract(year from desde)`}
        ],         
        primaryKey: [cuil.name, 'desde', idr.name],
        foreignKeys: [
            {references: 'annios'  , fields: [año.name], onUpdate: 'no action'},
            {references: 'personal', fields: [cuil.name]},
            {references: 'cod_novedades', fields: [cod_nov.name]},
            {references: 'fechas', fields: [{source:'desde', target:'fecha'}], alias:'desde'},
            {references: 'fechas', fields: [{source:'hasta', target:'fecha'}], alias:'hasta'},
        ],
        constraints: [
            {constraintType:'check', consName:'desde y hasta deben ser del mismo annio', expr:`extract(year from desde) is not distinct from extract(year from desde)`}
        ],
        hiddenColumns: [idr.name],
        sql:{
            policies: politicaNovedades,
        }
    };
}
