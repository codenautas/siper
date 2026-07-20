"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades";
import {sector} from "./table-sectores";

import { sqlEnvolventeDesdeHastaDeNovedadVigente } from "./table-novedades_vigentes";
import { sqlPersonas } from "./table-personas";
import { s_revista } from "./table-situacion_revista";
import { FieldDefinition } from "backend-plus";

const sqlParteDiarioBase = (novedades_vigentes: string) => `
select 
        p.cuil,
        p.apellido,
        p.nombres,
        p.ficha,
        p.banda_horaria,
        p.situacion_revista,
        p.activo,
        p.horario_entrada,
        p.horario_salida,
        p.es_laborable,
        p.cant_horas_esperadas,
        p.sector,
        p.sector_nombre,
        nv.*,
        cn.novedad,
        cn.requiere_fichadas,
        cn.cuenta_horas,
        cn.injustificado,
        bh.descripcion as bh_descripcion,
        puntos_compatibles(nv.idper, nv.fecha, nv.cod_nov, array[lower(nv.fichadas), upper(nv.fichadas)]) as puntos_compatibles
    from ${novedades_vigentes} nv 
        inner join lateral (${sqlPersonas('nv.fecha')} WHERE p.idper = nv.idper) p 
            on nv.fecha between coalesce(p.registra_novedades_desde, p.fecha_ingreso) and coalesce(p.fecha_egreso, nv.fecha)
        inner join bandas_horarias bh using (banda_horaria)
        left join cod_novedades cn using (cod_nov)
`

export const sqlParteDiario= sqlParteDiarioBase(`(SELECT
        nv.idper,
        nv.fecha,
        nv.cod_nov,
        nv.fichadas,
        nv.annio,
        nv.trabajable,
        nv.horas
    from novedades_vigentes nv)`);

export const sqlParteDiarioExtendido= sqlParteDiarioBase(sqlEnvolventeDesdeHastaDeNovedadVigente);

const SUMA_HORAS = `sum(horas)`;
const HORAS_ESPERADAS = `(sum(cant_horas_esperadas) FILTER (WHERE horas is not null) || ' hours')::interval`;
const SALDO_HORAS = `${SUMA_HORAS} - ${HORAS_ESPERADAS}`
const BAJO_UMBRAL_HORAS = `(${SALDO_HORAS} < '-7 hours'::interval) is true`
export const sqlParteDiarioAgrupado = `count(*) as dias_mes,
        count(*) FILTER (WHERE es_laborable) as laborables,
        count(horas) as dias_promediados,
        ${SUMA_HORAS} as suma_horas,
        ${HORAS_ESPERADAS} as horas_esperadas,
        avg(horas) as promedio_horas,
        (avg(cant_horas_esperadas) FILTER (WHERE horas is not null) || ' hours')::interval as promedio_esperado,
        ${SALDO_HORAS} as saldo_horas,
        count(injustificado) as dias_injustificados,
        count(injustificado) > 0 as tiene_injustificados,
        ${BAJO_UMBRAL_HORAS} as bajo_umbral_horas,
        (${BAJO_UMBRAL_HORAS} OR count(injustificado) > 0) is true as con_problemas,
        (${BAJO_UMBRAL_HORAS} OR count(injustificado) > 0 OR ${SUMA_HORAS} > '0 hours'::interval OR ${HORAS_ESPERADAS} > '0 hours'::interval) is true as tiene_interes
    FROM (${sqlParteDiario}) inner join parametros on true
    WHERE fecha BETWEEN $1 AND $1::date + interval '1 month' - interval '1 day'`

// Función genérica para la configuración base de las tablas
export function parte_diario(context: TableContext): TableDefinition {
    return {
        name: "parte_diario",
        elementName: "parte_diario",
        fields: [
            idper,
            { name: 'ficha'   , typeName: 'text' , title: 'ficha'},
            { name: 'cuil'    , typeName: 'text' },
            { name: 'apellido', typeName: 'text'},
            { name: 'nombres' , typeName: 'text'},
            { name: 'fecha'  , typeName: 'date' },
            sector,
            { name: 'sector_nombre', typeName: 'text', title: 'sector departamento área' },        // <-- AGREGADO
            cod_nov,
            { name: 'novedad', typeName: 'text'},
            { name: 'fichada', typeName: 'text'},
            { name: 'horas', typeName: 'interval' },
            { name: 'horario', typeName: 'text' },
            { name: 'mismo_cod_nov_desde', typeName: 'date' , label: 'm.c.n. desde', description: 'el código de novedad está registrado desde'},
            { name: 'mismo_cod_nov_hasta', typeName: 'date' , label: 'm.c.n. hasta', description: 'el código de novedad está registrado hasta'},
            { name: 'habiles', typeName: 'integer' },
            { name: 'corridos', typeName: 'integer' },
            s_revista,
            { name: 'banda_horaria', typeName: 'text'},
            { name: 'bh_descripcion', typeName: 'text', title: 'descripción' },
            { name: 'injustificado' , typeName: 'boolean'},
            ...(context.be.config.siper?.puntos_compatibles ? [{ name: 'puntos_compatibles', typeName: 'boolean', description: 'posee puntos compatibles en entrada y salida'}] : [] ) as FieldDefinition[],
            { name: 'activo', typeName: 'boolean'},
        ],
        primaryKey: [idper.name, 'fecha', cod_nov.name],
        hiddenColumns: [],
        constraints: [
        ],
        sql:{
            isTable: false,
            from:`(select x.*,
                    (SELECT string_agg(
                        CASE WHEN lower_inf(rng) THEN 'X' 
                            ELSE to_char(lower(rng), 'FMHH24:MI') 
                        END
                        || ' - ' ||
                        CASE WHEN upper_inf(rng) THEN 'X' 
                            ELSE to_char(upper(rng), 'FMHH24:MI') 
                        END,
                        ' / '
                        ORDER BY ord
                    )
                    FROM unnest(fichadas) WITH ORDINALITY AS t(rng, ord)) as fichada,
                    hora_texto(horario_entrada) || ' - ' || hora_texto(horario_Salida) as horario
                from (${sqlParteDiarioExtendido}) x
            )`,
        },
        sortColumns:[{column:'apellido'}, {column:'nombres'}],
    };
}