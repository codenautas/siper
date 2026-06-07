"use strict";

import {TableDefinition, TableContext} from "./types-principal";

import {idper} from "./table-personas"
import {cod_nov} from "./table-cod_novedades";
import {sector} from "./table-sectores";

import { sqlJoinDesdeHastaDeNovedadVigente } from "./table-novedades_vigentes";
import { sqlPersonas } from "./table-personas";
import { s_revista } from "./table-situacion_revista";

export const sqlParteDiarioBase = `
select 
        p.idper, 
        p.sector,
        p.ficha as persona_ficha,
        p.cuil,
        p.apellido,
        p.nombres,
        p.ficha,
        p.banda_horaria,
        p.situacion_revista,
        p.activo,
        p.horario_entrada,
        p.horario_salida,
        dds,
        laborable,
        nv.fecha, 
        nv.cod_nov,
        nv.annio,
        nv.trabajable,
        nv.detalles,
        nv.fichadas,
        nv.horas,
        cn.novedad,
        cn.requiere_fichadas,
        cn.cuenta_horas,
        cn.injustificado,
        bh.descripcion as bh_descripcion
    from novedades_vigentes nv 
        inner join lateral (${sqlPersonas('nv.fecha')}) p using (idper)
        inner join bandas_horarias bh using (banda_horaria)
        left join cod_novedades cn using (cod_nov)
`

export const sqlParteDiario= `
select p.*,
        s.nombre_sector as sector_nombre,
        nvdh.desde,
        nvdh.hasta,
        nvdh.habiles,
        nvdh.corridos
    from
        (${sqlParteDiarioBase}) p
        left join sectores s using (sector)
        left join lateral (${sqlJoinDesdeHastaDeNovedadVigente}) nvdh on true
`;

// Función genérica para la configuración base de las tablas
export function parte_diario(_context: TableContext): TableDefinition {
    return {
        name: "parte_diario",
        elementName: "parte_diario",
        fields: [
            idper,
            { name: 'persona_ficha'   , typeName: 'text' , title: 'ficha'},
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
            { name: 'desde', typeName: 'date' },
            { name: 'hasta', typeName: 'date' },
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
                from (${sqlParteDiario}) x
            )`,
        },
        sortColumns:[{column:'apellido'}, {column:'nombres'}],
    };
}