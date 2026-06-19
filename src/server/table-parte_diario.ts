"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades";
import {sector} from "./table-sectores";

import { sqlEnvolventeDesdeHastaDeNovedadVigente } from "./table-novedades_vigentes";
import { sqlPersonas } from "./table-personas";
import { s_revista } from "./table-situacion_revista";

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
        bh.descripcion as bh_descripcion
    from ${novedades_vigentes} nv 
        inner join lateral (${sqlPersonas('nv.fecha')}) p using (idper)
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
export const sqlParteDiarioAgrupado = `SELECT count(*) as dias_mes,
        count(*) FILTER (WHERE es_laborable) as laborables,
        count(horas) as dias_promediados,
        ${SUMA_HORAS} as suma_horas,
        ${HORAS_ESPERADAS} as horas_esperadas,
        avg(horas) as promedio_horas,
        (avg(cant_horas_esperadas) FILTER (WHERE horas is not null) || ' hours')::interval as promedio_esperado,
        ${SUMA_HORAS} - ${HORAS_ESPERADAS} as saldo_horas
    FROM (${sqlParteDiario})`

// Función genérica para la configuración base de las tablas
export function parte_diario(_context: TableContext): TableDefinition {
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