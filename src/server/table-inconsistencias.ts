"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades";
import {annio} from "./table-annios"
import {pauta} from "./table-pautas"
import { sqlNovPer } from "./table-nov_per";
import { sqlPersonas } from "./table-personas";

export function inconsistencias(_context: TableContext): TableDefinition{
    return {
        name: 'inconsistencias',
        elementName: 'inconsistencia',
        fields:[
            idper,
            annio,
            pauta,
            cod_nov,
        ],
        primaryKey: [idper.name, annio.name, pauta.name], // INCOMPLETO
        softForeignKeys: [
            {references: 'annios'  , fields: [annio.name], onUpdate: 'no action'},
            {references: 'personas', fields: [idper.name], displayFields:['apellido', 'nombres', 'idmeta4', 'cuil', 'ficha']},
            {references: 'cod_novedades', fields: [cod_nov.name]},
            {references: 'pautas', fields:[pauta.name], displayFields:['descripcion']}
        ],
        constraints: [
        ],
        sql:{
            isTable: false,
            from:`(SELECT q.idper, NULL::INTEGER as annio, q.pauta, cod_nov
                     FROM
                     (
                     SELECT idper, NULL::INTEGER as annio, 'ACTULTDIA' pauta, NULL::TEXT as cod_nov 
                       FROM personas
                       WHERE activo AND fecha_egreso IS NOT NULL
                     UNION
                     SELECT idper, NULL::INTEGER as annio, 'ACTREGDES' pauta, NULL::TEXT as cod_nov 
                       FROM personas
                       WHERE activo AND registra_novedades_desde IS NULL
                     UNION
                     SELECT idper, NULL::INTEGER as annio, 'ACTSINANT' pauta, NULL::TEXT as cod_nov 
                       FROM personas
                       WHERE activo AND para_antiguedad_relativa IS NULL
                     UNION
                     SELECT idper, NULL::INTEGER as annio, 'CUILINV' pauta, NULL::TEXT as cod_nov 
                       FROM personas
                       WHERE validar_cuit(cuil) = false -- Aquí usamos la expresión para calcular cuil_valido
                     UNION
                     SELECT idper, NULL::INTEGER as annio, 'CUILINV' pauta, NULL::TEXT as cod_nov 
                       FROM personas
                       WHERE cuil IS NULL OR cuil = '' 
                     UNION
                     SELECT idper, NULL::INTEGER as annio, 'INASINULT' pauta, NULL::TEXT as cod_nov 
                       FROM personas
                       WHERE NOT activo AND fecha_egreso IS NULL
                     UNION
                     SELECT idper, NULL::INTEGER as annio, 'ANULREGDES' pauta, NULL::TEXT as cod_nov 
                       FROM personas
                       WHERE activo IS NULL AND registra_novedades_desde IS NOT NULL
                     UNION
                     SELECT idper, NULL::INTEGER as annio, 'ANULCONULT' pauta, NULL::TEXT as cod_nov 
                       FROM personas
                       WHERE activo IS NULL AND fecha_egreso IS NOT NULL
                     UNION
                     SELECT pe.idper, NULL::INTEGER as annio, 'ANTCOMVSRE' pauta, NULL::TEXT as cod_nov 
                       /*,q.fecha_actual-pe.para_antiguedad_relativa, q.antiguedad*/
                       FROM personas pe 
                       JOIN (SELECT idper, fecha_actual, SUM(coalesce(hasta,fecha_actual)-desde) antiguedad
                             /*case when hasta is NULL then current_date else hasta end*/
                             FROM trayectoria_laboral h
                             JOIN parametros p ON unico_registro
                             GROUP BY idper, fecha_actual
                            ) q1
                       ON pe.idper = q1.idper
                       WHERE pe.activo and q1.fecha_actual-pe.para_antiguedad_relativa <> /*IS DISTINCT FROM*/ q1.antiguedad
                     UNION
                     SELECT idper, EXTRACT(year FROM desde) annio, 'CORRIDOS' pauta, cod_nov 
                     FROM (SELECT v.idper, v.cod_nov, r.desde, r.hasta, r.hasta-r.desde+1 cantdias , count(*) cantnov
                            FROM novedades_vigentes v
                            JOIN cod_novedades c ON v.cod_nov = c.cod_nov
                            JOIN (SELECT idper, cod_nov, MIN(desde) desde, MAX(hasta) hasta 
                                    FROM novedades_registradas
                                    GROUP BY idper,cod_nov
                                 ) r ON v.idper = r.idper and v.fecha between r.desde and r.hasta
                            WHERE corridos
                            GROUP BY v.idper, v.cod_nov, r.desde, r.hasta, r.hasta-r.desde+1
                          ) q2
                     WHERE cantdias IS DISTINCT FROM cantnov
                     UNION
                     SELECT idper, NULL::INTEGER as annio, 'ACTSINSEC' pauta, NULL::TEXT as cod_nov 
                       FROM personas
                       WHERE activo AND sector IS NULL
                     UNION
                     SELECT idper, NULL::INTEGER as annio, 'ACTSINSIT' pauta, NULL::TEXT as cod_nov 
                       FROM (${sqlPersonas})
                       WHERE activo AND situacion_revista IS NULL
                     UNION
                     SELECT idper, annio, 'EXCEDIDO' as pauta, cod_nov
                       FROM (${sqlNovPer({})}) q3
                       WHERE q3.error_saldo_negativo
                     ) q
            )`
        }
    };
}
